# OpenClaw Pixel Office

Design and deploy AI agent teams with a visual office builder. Create agents, configure their roles and dependencies, design your office layout, and export a ready-to-use AgentPack for OpenClaw.

---

## What is this?

OpenClaw Pixel Office is a **visual builder** for creating agent teams. Instead of editing config files by hand, you:

- **Define agents** – name, role, tone, tools, and dependencies
- **Design your office** – place desks, chairs, meeting spots, and furniture on a map
- **Export a ZIP** – get an AgentPack compatible with OpenClaw (free-sample layout)

The generated pack includes everything OpenClaw needs: `agents/<id>/IDENTITY.md`, `SOUL.md`, `openclaw-config.json`, and optional office layout with TMX map for 2D visualization.

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Install and run

```bash
pnpm install
pnpm dev:site
```

Open http://localhost:5173 in your browser.

---

## How to use

### Step 1: Choose or create a team

The builder comes with a preset "Virtual IT Agency" – CEO, PM, Developer, QA, Designer, Researcher. You can customize it or start from scratch.

<!-- Add screenshot: agent list / preset selector -->

### Step 2: Edit agents

Click an agent to edit:

- **Name** and **Role**
- **Tone** – professional, technical, analytical, creative, curious
- **Tools** – read_file, write_file, run_terminal, web_search, etc.
- **Spots** – desk, chair, meeting, closet (where the agent appears in the office)
- **Dependencies** – who this agent reports to or collaborates with

<!-- Add screenshot: agent editor panel -->

### Step 3: Design the office layout

Use the layout editor to:

- Place floor tiles and walls
- Add furniture (desks, chairs, meeting tables, closets)
- Assign spots so agents know where to "work" in the map

The layout can be exported as a TMX map for 2D office visualization (PixiJS, Phaser, etc.).

<!-- Add screenshot: layout editor with grid -->

### Step 4: Generate and download

Click **Generate & Download** to create a ZIP file. The ZIP contains:

- `agents/<id>/` – IDENTITY.md and SOUL.md per agent
- `openclaw-config.json` – agent list, models, workspaces
- `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `MEMORY.md`, `HEARTBEAT.md` – pack templates
- `office/` – layout and TMX map (when configured)

<!-- Add screenshot: download button and modal -->

### Step 5: Use with OpenClaw

Extract the ZIP and copy the contents into your `.openclaw` folder (or use the extracted folder as your OpenClaw workspace root). Restart OpenClaw to load the new agents.

See the in-app guide ("What to do with the ZIP file?") for detailed steps.

---

## Architecture

| Component | Purpose |
|-----------|---------|
| **site** | Public builder UI – agent editor, layout editor, ZIP download |
| **office-viewer** | 2D tilemap viewer (PixiJS) – preview office layout |
| **runtime** | Local web UI and 2D office visualization |
| **zipgen** | Generates AgentPack ZIP (free-sample layout) |
| **core** | Domain models: Agent, Plan, Task, Event |
| **office-sim** | 2D engine: map, pathfinding, sprites |
| **agent-control** | Orchestrator for task execution and adapters |

OpenClaw is the execution backend. This tool is the planner, visualizer, and adapter layer.

---

## Project structure

```
apps/
  site/           # Builder (GitHub Pages)
  office-viewer/ # 2D tilemap viewer (PixiJS)
  runtime/       # Local web UI + 2D office
packages/
  toon/       # TOON parser, serializer
  core/       # Agent, Plan, Task, Event
  zipgen/     # ZIP generator
  office-sim/ # 2D map engine
  agent-control/  # Orchestrator, adapters
  storage/    # SQLite, migrations
docs/
  AGENT_ARCHITECTURE.md
  ZIP_STRUCTURE.md
  OFFICE_DESIGN_FORMAT.md
```

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:site` | Start the builder at http://localhost:5173 |
| `pnpm dev:office-viewer` | Start office tilemap viewer at http://localhost:5176 |
| `pnpm dev:runtime` | Start runtime API (5175) and UI (5174) |
| `pnpm setup-office-assets` | Generate tiles and TMX for office-viewer |
| `pnpm build` | Build all packages |

---

## Documentation

- [Agent Architecture](docs/AGENT_ARCHITECTURE.md) – how agents work, adapters, data flow
- [ZIP Structure](docs/ZIP_STRUCTURE.md) – generated pack layout
- [Office Design Format](docs/OFFICE_DESIGN_FORMAT.md) – layout format and collision

---

## Contributing

We welcome contributions. Here is how you can help:

**Code**

- Fix bugs, add features, improve docs
- Open an issue first for larger changes
- Follow existing code style and structure

**Feedback**

- Report issues or suggest improvements
- Share how you use the tool

**Documentation**

- Improve README, docs, or in-app guides
- Add examples or tutorials

To contribute:

1. Fork the repository
2. Create a branch for your change
3. Make your edits and test
4. Open a pull request with a clear description

---
