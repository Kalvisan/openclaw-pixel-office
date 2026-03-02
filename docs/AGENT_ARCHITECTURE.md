# Agent Architecture – OpenClaw Office

> How agents work in the system, how they process data, and how to architecturally connect multiple OpenClaw agents or other agents (nanobot, etc.).

## Overview

**Agent Control** is the central orchestrator that runs in the OpenClaw instance and controls:

- Task execution
- Routing to different adapters (OpenClaw, Nanobot, etc.)
- Data flow between agents (memory, handoffs, artifacts)

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Instance                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Orchestrator (agent-control)             │   │
│  │  • Picks queued tasks from SQLite                     │   │
│  │  • Routes to adapter by agent_id → adapter_type       │   │
│  │  • Polls status, updates DB                           │   │
│  │  • processData() for memory/handoffs                  │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ OpenClaw    │ │ Nanobot     │ │ Custom      │            │
│  │ Adapter     │ │ Adapter      │ │ Adapter     │            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
│         │               │               │                    │
└─────────┼───────────────┼───────────────┼─────────────────────┘
          │               │               │
          ▼               ▼               ▼
    OpenClaw API    Nanobot API    Custom backend
```

## Components

### 1. Orchestrator (`packages/agent-control`)

- **start()** – starts polling loop (default: 2s)
- **tick()** – per iteration: polls running status, picks new queued tasks
- **stop()** – stops the loop
- **processData(packet)** – processes DataPacket (memory, handoff, artifact)

### 2. Adapter Registry

| Adapter Type | Status | Description |
|--------------|--------|-------------|
| `openclaw` | ✅ Implemented | OpenClaw API – POST /api/runs, GET /api/runs/:id |
| `nanobot` | 🔲 Stub | Placeholder – implement when API available |
| `*` | Custom | registerAdapter(type, factory) |

**Connecting:**

```ts
import { registerAdapter, getAdapter } from "@openclaw-office/agent-control";

registerAdapter("my-agent", (type, config) => new MyAdapter(config));
const adapter = getAdapter("my-agent", { baseUrl: "..." });
```

### 3. Routing: agent_id → adapter_type

Config: `agent_adapters: Record<string, AdapterType>`

```ts
{
  agent_adapters: {
    "ceo": "openclaw",
    "dev": "openclaw",
    "nanobot-1": "nanobot"
  }
}
```

Default: `agent_id` without entry → `openclaw`.

### 4. Data Flow

**DataPacket** – data unit between agents:

- `type`: "memory" | "handoff" | "artifact" | "event"
- `from_agent_id`, `to_agent_id`
- `plan_id`, `payload`, `timestamp`

**Memory** – in `memory_items` table (key, summary_compact, details_compact).

**Events** – in `events` table (event_type, payload, seq).

**Handoffs** – plan handoffs, artifacts – stored in events payload.

## Data Processing

1. **Task submit** – Orchestrator → Adapter.submitTask()
2. **Task result** – Adapter.getTaskStatus() → Orchestrator updates DB
3. **Data packet** – Orchestrator.processData() → events + memory_items
4. **Memory context** – getMemoryContext(db) – latest memory items

## Usage in Runtime

```ts
import { createDb } from "@openclaw-office/storage";
import {
  Orchestrator,
  registerBuiltinAdapters,
} from "@openclaw-office/agent-control";

registerBuiltinAdapters();

const db = createDb("./data/office.db");
const orchestrator = new Orchestrator({
  db,
  config: {
    agent_adapters: { "dev": "openclaw", "bot": "nanobot" },
    poll_interval_ms: 2000,
  },
  onTaskDone: (taskId, result) => console.log("Done", taskId, result),
});

orchestrator.start();
// ... later: orchestrator.stop();
```

## Storage Schema (relevant)

- **tasks** – task_id, plan_id, agent_id, payload, status, result, error
- **events** – event_id, event_type, timestamp, plan_id, agent_id, payload, seq
- **memory_items** – key, summary_compact, details_compact, updated_at

## Adding New Adapter

1. Implement `ExecutorAdapter` (submitTask, getTaskStatus, fetchResult, capabilities)
2. `registerAdapter("mytype", (type, config) => new MyAdapter(config))`
3. Set `agent_adapters: { "agent-id": "mytype" }`
