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

const API = "/api";

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [godTask, setGodTask] = useState({ plan_id: "", agent_id: "" });

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

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>OpenClaw Runtime - 2D Office</h1>
      <p style={{ color: "#8b949e" }}>
        Local web UI. Event log is the source of truth for visualization.
      </p>

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
