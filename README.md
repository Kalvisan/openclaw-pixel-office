# OpenClaw Pixel Office

Deterministic task planner and 2D office visualization for OpenClaw agents.

## Architecture

- **OpenClaw** – execution and session source of truth
- **This tool** – planner, visualization, adapter layer

## Repo structure

```
/apps
  /site      # Public page + builder (GitHub Pages)
  /runtime   # Local web-ui + 2D office
/packages
  /toon      # TOON parser, serializer, schema validator
  /core      # Domain models: Agent, Plan, Task, Event, Memory
  /zipgen    # Zip generator (site side)
  /office-sim # 2D engine: map, pathfinding, sprites
  /adapters  # OpenClawAdapter, NanobotAdapter (later)
  /storage   # SQLite, migrations, locks, retention
```

## Default decisions

- Event log is source of truth for visualization
- SQLite queue: at-least-once with idempotency, externally as single flow
- Lock: lease-based
- Plan: snapshot revisions (not diff)
- MVP: 1 OpenClaw endpoint

## Getting started

```bash
pnpm install
pnpm build
```

### Builder (site)

```bash
pnpm dev:site
```

Open http://localhost:5173 – preset "Virtual IT Agency", agent editor, DAG, zip download.

### Runtime

```bash
pnpm dev:runtime
```

Starts API (port 5175) and UI (port 5174). GET /api/state, GET /api/events, POST /api/god/task.
