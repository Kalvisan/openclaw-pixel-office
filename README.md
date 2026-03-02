# OpenClaw Pixel Office

A visual builder to create AI agent teams for OpenClaw. Define agents, design your office layout, and export a ready-to-use AgentPack.

---

## For users

### What you need

- **Node.js 18+**
- **pnpm** (`npm install -g pnpm`)
- **OpenClaw** installed and running (optional until you want to use the exported pack)

### How to run

```bash
pnpm install
pnpm dev:site
```

Open **http://localhost:5173** in your browser.

### What to do

1. **Pick a team preset** – "Virtual IT Agency" (CEO, PM, Developer, QA, Designer, Researcher) or start custom.
2. **Edit each agent** – name, role, tone, tools (read_file, write_file, run_terminal, web_search), spots (desk, chair, meeting, closet), and who they report to.
3. **View the office layout** – preview of desks, chairs, meeting spots.
4. **Click "Generate & Download"** – you get a ZIP file.
5. **Install the ZIP into OpenClaw:**
   - Find your **`.openclaw`** folder (may be hidden).
   - If you **already have OpenClaw with data**: backup first, extract ZIP elsewhere, copy only `agents/`, `AGENTS.md`, `openclaw-config.json`, `SOUL.md`, `office/` into `.openclaw`. Do not overwrite `plans`, `MEMORY.md`, `USER.md`.
   - If **starting from scratch**: extract the ZIP and copy the whole `openclaw-office` folder into `.openclaw`.
   - **Restart OpenClaw.**

After download, the app shows a guide ("What to do with the ZIP file?") with detailed steps.

---

## For developers

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
| `pnpm dev:site` | Builder – http://localhost:5173 |
| `pnpm dev:office-viewer` | Tilemap viewer – http://localhost:5176 |
| `pnpm dev:runtime` | Runtime API (5175) + UI (5174) |
| `pnpm setup-office-assets` | Generate tiles and TMX for office-viewer |
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
