# Gateway API Integration Plan — Hybrid + Live Office

> ZIP export stays as-is. When run on user's OpenClaw instance: offer API-based config or auto-configure. **Live office** must be driven by Gateway API so agents move and act based on real Gateway data.

## Goals

1. **Keep ZIP generation** — unchanged, user can still download and manually install
2. **Hybrid mode** — when project runs on OpenClaw instance:
   - Option A: Configure agents from extracted/copied files (user chooses)
   - Option B: Auto-configure everything via API (easier)
3. **Live office** — 2D office where agents move and do things based on **Gateway API** events (tool_call, response, status, sessions)

## Current vs Target

| Component | Current | Target |
|-----------|---------|--------|
| ZIP | ✅ Generates AgentPack | ✅ Unchanged |
| Config | Manual copy to `.openclaw` | Optional: API writes to openclaw.json / workspace |
| Runtime | Own SQLite, OpenClawAdapter → `/api/runs` (non-existent) | **Gateway WebSocket** as source of truth |
| Office viewer | Static TMX map, no agents | **Live office**: agents at spots, move on events |
| Data flow | Local DB → Runtime UI | **Gateway WS** → Runtime bridge → Live office |

## Architecture: Live Office Driven by Gateway

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway (port 18789)                 │
│  WebSocket: status, tool_call, tool_result, response, sessions   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Pixel Office Runtime (bridge)                       │
│  • Connects to Gateway WebSocket                                 │
│  • Maps Gateway events → agent states (idle, working, deliver)   │
│  • Exposes /api/live-office (agent positions, events)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Live Office UI (office-viewer + runtime)            │
│  • TMX map + agent sprites at desk/chair/meeting spots          │
│  • Agents move: idle→desk (working), desk→meeting (deliver)     │
│  • Tool calls = "working" at desk; response = transition         │
└─────────────────────────────────────────────────────────────────┘
```

## Gateway API Usage

### 1. WebSocket connection

- **URL**: `ws://localhost:18789` (or `OPENCLAW_GATEWAY_WS`)
- **Handshake**: `connect` with `role: "operator"`, `scopes: ["operator.read"]` (minimal for status/events)
- **Auth**: Token in URL if `gateway.auth.enabled`

### 2. Events that drive agent state

| Gateway event | Agent state mapping |
|---------------|---------------------|
| `tool_call` (status: executing) | Agent → **working** at desk |
| `tool_result` | Agent → brief **idle**, then next action |
| `response` | Agent finished turn → **idle** or **meeting** |
| `status` (sessions) | Map session → agent_id, infer activity |
| `heartbeat_status` | Optional: agents doing heartbeat tasks |

### 3. Config read/write (hybrid)

- **Read**: `openclaw.json` from `~/.openclaw/` — Gateway may expose config via `config.get` or similar (check protocol schema)
- **Write**: Merge agents into `openclaw.json` — either file write or API if available
- **Fallback**: If no config API, keep ZIP + manual; offer "Open folder" to `.openclaw`

## Implementation Status

**Phase 2–3 done (local DB):** Runtime uses tasks from SQLite to drive live office. `GET /api/live-office` returns AgentSim with positions. UI shows agents (blue=idle, green=working). `POST /api/demo/seed` creates a demo task for testing without OpenClaw.

**Phase 1 (Gateway WebSocket):** To be added when Gateway connection is available.

## Implementation Phases

### Phase 1: Gateway WebSocket client (runtime) — TODO

- [ ] Add `packages/gateway-client` or extend `packages/adapters`
- [ ] Connect to `ws://localhost:18789`, handle `connect` handshake
- [ ] Subscribe to / receive: `tool_call`, `tool_result`, `response`, `status`
- [ ] Map `agent_id` from events to our agent list (from layout spots)

### Phase 2: Runtime bridge — Gateway → live state

- [ ] New endpoint: `GET /api/live-office` — returns `{ agents: AgentSim[], events: Event[] }`
- [ ] Bridge: Gateway events → update in-memory agent states
- [ ] Use `office-sim` `AgentSim` (idle, working, deliver, pickup, meeting)
- [ ] Map agents to spots from `office/layout.toon` (desk, chair, meeting, closet)

### Phase 3: Live office UI

- [ ] Merge `office-viewer` (TMX) with runtime UI or embed in runtime
- [ ] Render agent sprites at `(x,y)` from `AgentSim`
- [ ] Pathfinding: `office-sim` `bfsPath` when agent moves desk→meeting etc.
- [ ] State → animation: working = typing at desk, deliver = walk with papers

### Phase 4: Hybrid config

- [ ] Detect: is OpenClaw running? (e.g. `ws://localhost:18789` reachable)
- [ ] If yes: show "Configure via API" or "Auto-configure from ZIP"
- [ ] If config API exists: read agents from Gateway, merge our workflow-* into it
- [ ] If not: keep "Download ZIP" + install guide

## Data Mapping: Gateway → AgentSim

```ts
// From office/layout.toon spots
const spots = { desk: [...], chair: [...], meeting: [...], closet: [...] };

// Gateway tool_call: { agent_id, tool, status: "executing" }
// → AgentSim: state = "working", x,y = desk for agent_id

// Gateway response: { agent_id, ... }
// → AgentSim: state = "idle" or trigger "deliver" to next agent
```

## Dependencies

- Gateway WebSocket protocol (connect handshake, event types)
- OpenClaw `openclaw.json` structure for agents
- `office-sim` already has `AgentSim`, `bfsPath`, `Tile` — reuse

## Risks / Unknowns

1. **Gateway protocol** — exact methods/events may vary; need to inspect `schema.ts` or run Gateway and log frames
2. **Config API** — unclear if Gateway exposes config read/write; may need file-based merge only
3. **Multi-agent** — Gateway may have single "main" session; multi-agent might be via separate workspaces/nodes

## Next Steps

1. Run OpenClaw Gateway locally, connect via WebSocket, log all incoming messages
2. Document exact event types and payloads for `tool_call`, `response`, `status`
3. Implement Phase 1 (Gateway client) in a new package or `packages/adapters`
4. Wire Phase 2 (bridge) in runtime server
5. Extend office-viewer with agent sprites and state-driven updates
