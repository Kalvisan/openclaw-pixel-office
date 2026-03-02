# OpenClaw Pixel Office

A visual builder to create AI agent teams for OpenClaw. Define agents, design your office layout, and export a ready-to-use AgentPack.

---

## Install on your OpenClaw (step-by-step)

### Step 1: Prerequisites

- **Node.js 18+** – [nodejs.org](https://nodejs.org)
- **pnpm** – `npm install -g pnpm`
- **pm2** – `npm install -g pm2` (for runtime control: start, stop, restart, logs)
- **OpenClaw** – [openclaw.ai](https://openclaw.ai) – install and run it first

### Step 2: Get the project

```bash
git clone https://github.com/Kalvisan/openclaw-pixel-office.git
cd openclaw-pixel-office
pnpm install
```

### Step 3: First time – create agents and install the pack

Run the **builder** (for creating agents and generating ZIP):

```bash
pnpm dev:site
```

Open **http://localhost:5173**. Pick a team preset, edit agents, click **Generate & Download**. Then:

- **If you have OpenClaw with data:** Backup `.openclaw`, extract the ZIP elsewhere. Copy only `agents/`, `AGENTS.md`, `openclaw-config.json`, `SOUL.md`, `office/` into `.openclaw`. Do not overwrite `plans/`, `MEMORY.md`, `USER.md`.
- **If OpenClaw is new:** Extract the ZIP and copy the whole `openclaw-office` folder into `.openclaw`.

Restart OpenClaw. You only need the builder when creating or changing agents.

### Step 4: Run for daily use (orchestration + office view)

**Start** (runs in background, survives terminal close):
```bash
pnpm runtime:start
```

**Stop:**
```bash
pnpm runtime:stop
```

**Restart:**
```bash
pnpm runtime:restart
```

**View logs** (live):
```bash
pnpm runtime:logs
```

**Check status:**
```bash
pnpm runtime:status
```

Open **http://localhost:5174** – orchestration status and office view.

---

## For developers

### Run locally

```bash
pnpm install
pnpm dev:site
```

Open **http://localhost:5173** – builder UI for development and testing.

### Architecture

| Component | Purpose |
|-----------|---------|
| **site** | Builder UI – agent editor, layout preview, ZIP download |
| **office-viewer** | 2D tilemap viewer (PixiJS) |
| **runtime** | Local API + UI for orchestration |
| **zipgen** | AgentPack ZIP generator |
| **core** | Domain models: Agent, Plan, Task, Event |
| **office-sim** | 2D engine: map, pathfinding, sprites |
| **agent-control** | Orchestrator, task routing, adapters |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:site` | Builder – create agents, generate ZIP (http://localhost:5173) |
| `pnpm dev:runtime` | Runtime – orchestration + office view (http://localhost:5174) |
| `pnpm runtime:start` | Start runtime via pm2 (background) |
| `pnpm runtime:stop` | Stop runtime |
| `pnpm runtime:restart` | Restart runtime |
| `pnpm runtime:logs` | View runtime logs |
| `pnpm runtime:status` | Check runtime status |
| `pnpm build` | Build all packages |

### Project structure

```
apps/
  site/           # Builder
  office-viewer/  # 2D tilemap viewer
  runtime/        # Orchestration API + UI
extensions/
  pixel-office/   # OpenClaw plugin (scaffold)
packages/
  core/           # Agent, Plan, Task, Event
  zipgen/         # ZIP generator
  office-sim/     # Map engine
  agent-control/  # Orchestrator
  storage/        # SQLite
docs/
  AGENT_ARCHITECTURE.md
  ZIP_STRUCTURE.md
  OFFICE_DESIGN_FORMAT.md
```

### Documentation

- [Agent Architecture](docs/AGENT_ARCHITECTURE.md)
- [ZIP Structure](docs/ZIP_STRUCTURE.md)
- [Office Design Format](docs/OFFICE_DESIGN_FORMAT.md)

### Contributing

1. Fork the repository
2. Create a branch for your change
3. Make your edits and test
4. Open a pull request
