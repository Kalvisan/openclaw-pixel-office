/**
 * OpenClaw Gateway WebSocket client.
 * Connect with token only — works when allowInsecureAuth or localhost bypass is enabled.
 */

import WebSocket from "ws";

export type { WebSocket as GatewayWebSocket };

export interface GatewayConfig {
  url: string;
  token: string;
}

export interface GatewayMessage {
  type: string;
  id?: string;
  event?: string;
  payload?: unknown;
  ok?: boolean;
  error?: { message?: string; code?: string };
}

export type GatewayEventHandler = (msg: GatewayMessage) => void;

/** Call Gateway method, return response payload. */
export function callGateway(ws: WebSocket, method: string, params?: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    ws.send(JSON.stringify({ type: "req", id, method, params: params ?? {} }));

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as GatewayMessage;
        if (msg.id === id) {
          ws.off("message", handler);
          if (msg.type === "res" && msg.ok) resolve(msg.payload);
          else reject(new Error((msg.error as { message?: string })?.message ?? "Gateway error"));
        }
      } catch {
        // ignore
      }
    };
    ws.on("message", handler);
    setTimeout(() => {
      ws.off("message", handler);
      reject(new Error("Gateway timeout"));
    }, 10000);
  });
}

/** Connect to Gateway with token. Sends connect after challenge. Requires allowInsecureAuth or localhost. */
export async function connectGateway(config: GatewayConfig): Promise<WebSocket> {
  const url = config.url.startsWith("ws") ? config.url : config.url.replace(/^http/, "ws");
  const fullUrl = config.token ? `${url}?token=${encodeURIComponent(config.token)}` : url;

  const ws = new WebSocket(fullUrl);

  return new Promise((resolve, reject) => {
    let resolved = false;

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as GatewayMessage;

        if (msg.event === "connect.challenge") {
          const nonce = (msg.payload as { nonce?: string })?.nonce ?? "";
          ws.send(
            JSON.stringify({
              type: "req",
              id: `conn_${Date.now()}`,
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: { id: "pixel-office", version: "0.1.0", platform: "node", mode: "operator" },
                role: "operator",
                scopes: ["operator.read"],
                auth: config.token ? { token: config.token } : {},
                locale: "en-US",
                userAgent: "pixel-office/0.1.0",
                device: { id: "pixel-office", nonce, signature: "", signedAt: Date.now(), publicKey: "" },
              },
            })
          );
          return;
        }

        if (msg.type === "res" && (msg.payload as { type?: string })?.type === "hello-ok") {
          if (!resolved) {
            resolved = true;
            resolve(ws);
          }
          return;
        }

        if (msg.type === "res" && !msg.ok && !resolved) {
          resolved = true;
          reject(new Error((msg.error as { message?: string })?.message ?? "Gateway rejected"));
        }
      } catch {
        // ignore
      }
    });

    ws.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    ws.on("close", (code, reason) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Connection closed: ${code} ${String(reason)}`));
      }
    });
  });
}
