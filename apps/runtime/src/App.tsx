import { useEffect, useState } from "react";

interface State {
  agents: unknown[];
  plans: unknown[];
  tasks: unknown[];
}

interface EventRow {
  event_id: string;
  event_type: string;
  timestamp: number;
  plan_id?: string;
  agent_id?: string;
}

interface AgentSim {
  agent_id: string;
  state: string;
  x: number;
  y: number;
  desk_x?: number;
  desk_y?: number;
}

interface LiveOfficeState {
  agents: AgentSim[];
  layout: { width: number; height: number };
  tasks: { task_id: string; agent_id: string; status: string }[];
}

const API = "/api";
const TILE = 12;

function LiveOfficeView({
  live,
  onSeedDemo,
}: {
  live: LiveOfficeState | null;
  onSeedDemo?: () => void;
}) {
  if (!live) return null;
  const { agents, layout } = live;
  const w = layout.width * TILE;
  const h = layout.height * TILE;

  return (
    <div style={{ marginBottom: 24 }}>
      <h2>Live Office</h2>
      <p style={{ color: "#8b949e", fontSize: 12, marginBottom: 8 }}>
        Agents move based on task status (idle=chair, working=desk). Data from /api/live-office.
      </p>
      <div
        style={{
          position: "relative",
          width: w,
          height: h,
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 8,
        }}
      >
        {agents.map((a) => (
          <div
            key={a.agent_id}
            title={`${a.agent_id} — ${a.state}`}
            style={{
              position: "absolute",
              left: a.x * TILE - 6,
              top: a.y * TILE - 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: a.state === "working" ? "#238636" : "#58a6ff",
              border: "2px solid #fff",
              zIndex: 10,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#8b949e", marginTop: 4, display: "flex", gap: 12, alignItems: "center" }}>
        <span>{agents.length} agents · {live.tasks.filter((t) => t.status === "running").length} running</span>
        {onSeedDemo && (
          <button
            onClick={onSeedDemo}
            style={{ padding: "4px 8px", fontSize: 11, background: "#21262d", border: "1px solid #30363d", borderRadius: 4, color: "#c9d1d9", cursor: "pointer" }}
          >
            Seed demo
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [liveOffice, setLiveOffice] = useState<LiveOfficeState | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [godTask, setGodTask] = useState({ plan_id: "", agent_id: "" });
  const [config, setConfig] = useState<{ gatewayUrl: string; hasToken: boolean; gatewayConnected?: boolean } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [gatewayUrlInput, setGatewayUrlInput] = useState("ws://localhost:18789");
  const [configSaving, setConfigSaving] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch(`${API}/config`)
        .then((r) => r.json())
        .then((c) => {
          setConfig(c);
          if (c?.gatewayUrl) setGatewayUrlInput(c.gatewayUrl);
        })
        .catch(() => setConfig(null));
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const saveToken = () => {
    setConfigSaving(true);
    fetch(`${API}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gatewayToken: tokenInput.trim() || undefined,
        gatewayUrl: gatewayUrlInput.trim() || "ws://localhost:18789",
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setTokenInput("");
        return fetch(`${API}/config`);
      })
      .then((r) => r.json())
      .then((c) => {
        setConfig(c);
        if (c?.gatewayUrl) setGatewayUrlInput(c.gatewayUrl);
      })
      .catch(console.error)
      .finally(() => setConfigSaving(false));
  };

  useEffect(() => {
    const fetchState = () => {
      fetch(`${API}/state`)
        .then((r) => r.json())
        .then(setState)
        .catch(console.error);
    };
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchLive = () => {
      fetch(`${API}/live-office`)
        .then((r) => r.json())
        .then(setLiveOffice)
        .catch(() => setLiveOffice(null));
    };
    fetchLive();
    const id = setInterval(fetchLive, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchEvents = () => {
      const since = events.length ? Math.max(...events.map((e) => e.timestamp)) : 0;
      fetch(`${API}/events?since=${since}`)
        .then((r) => r.json())
        .then((d) => setEvents((prev) => [...prev, ...(d.events ?? [])]))
        .catch(console.error);
    };
    fetchEvents();
    const id = setInterval(fetchEvents, 1000);
    return () => clearInterval(id);
  }, []);

  const submitGodTask = () => {
    if (!godTask.plan_id || !godTask.agent_id) return;
    fetch(`${API}/god/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(godTask),
    })
      .then((r) => r.json())
      .then(console.log)
      .catch(console.error);
    setGodTask({ plan_id: "", agent_id: "" });
  };

  const seedDemo = () => {
    fetch(`${API}/demo/seed`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        console.log("Demo seeded:", d);
        setGodTask((t) => ({ ...t, plan_id: d.plan_id ?? t.plan_id, agent_id: "dev" }));
      })
      .catch(console.error);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>OpenClaw Runtime - 2D Office</h1>
      <p style={{ color: "#8b949e" }}>
        Enter your Gateway token — the system will automatically work with your OpenClaw.
      </p>

      <section style={{ marginBottom: 24, padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d" }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Gateway connection</h2>
        <p style={{ color: "#8b949e", fontSize: 12, marginBottom: 12 }}>
          Paste your OpenClaw Gateway token. Requires allowInsecureAuth in OpenClaw config for token-only auth.
        </p>
        {config?.hasToken && (
          <p style={{ fontSize: 12, marginBottom: 8 }}>
            {config.gatewayConnected ? (
              <span style={{ color: "#3fb950" }}>● Connected to Gateway</span>
            ) : (
              <span style={{ color: "#f85149" }}>● Not connected — check token and URL</span>
            )}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="password"
            placeholder="Gateway token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            style={{ padding: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#c9d1d9", minWidth: 200 }}
          />
          <input
            placeholder="ws://localhost:18789"
            value={gatewayUrlInput}
            onChange={(e) => setGatewayUrlInput(e.target.value)}
            style={{ padding: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#c9d1d9", minWidth: 180 }}
          />
          <button
            onClick={saveToken}
            disabled={configSaving}
            style={{ padding: "8px 16px", background: "#238636", border: "none", borderRadius: 4, color: "#fff", cursor: configSaving ? "wait" : "pointer" }}
          >
            {configSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {config?.hasToken && (
          <p style={{ color: "#3fb950", fontSize: 12, marginTop: 8 }}>Token saved. Restart runtime to apply.</p>
        )}
      </section>

      <LiveOfficeView live={liveOffice} onSeedDemo={seedDemo} />

      <section style={{ marginBottom: 24 }}>
        <h2>State</h2>
        <pre style={{ background: "#161b22", padding: 16, borderRadius: 8, overflow: "auto" }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Events (last 20)</h2>
        <pre style={{ background: "#161b22", padding: 16, borderRadius: 8, overflow: "auto", maxHeight: 300 }}>
          {events.slice(-20).map((e) => (
            <div key={e.event_id}>
              {new Date(e.timestamp).toISOString()} {e.event_type} plan={e.plan_id} agent={e.agent_id}
            </div>
          ))}
        </pre>
      </section>

      <section>
        <h2>God mode - task assignment</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <input
            placeholder="plan_id"
            value={godTask.plan_id}
            onChange={(e) => setGodTask((t) => ({ ...t, plan_id: e.target.value }))}
            style={{ padding: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#c9d1d9" }}
          />
          <input
            placeholder="agent_id"
            value={godTask.agent_id}
            onChange={(e) => setGodTask((t) => ({ ...t, agent_id: e.target.value }))}
            style={{ padding: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#c9d1d9" }}
          />
          <button
            onClick={submitGodTask}
            style={{
              padding: "8px 16px",
              background: "#238636",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
      </section>
    </div>
  );
}
