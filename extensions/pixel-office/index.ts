/**
 * OpenClaw Pixel Office – plugin scaffold
 * Registers service stub. Full implementation (orchestrator + HTTP server + static UI) in progress.
 */

export default function register(api: { registerService: (opts: { id: string; start: () => void; stop?: () => void }) => void }) {
  api.registerService({
    id: "pixel-office",
    start: () => {
      console.log("[pixel-office] Plugin loaded. Full implementation (orchestrator + web UI) coming soon.");
      console.log("[pixel-office] For now use: pnpm dev:site (builder) and pnpm dev:runtime (orchestration + API)");
    },
    stop: () => {
      console.log("[pixel-office] Plugin stopped");
    },
  });
}
