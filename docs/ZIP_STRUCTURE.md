# ZIP Output Structure

Generated ZIP layout.

## Folder Layout

```
openclaw-office/
├── workflow-<agent_id>/
│   ├── IDENTITY.md        # Name, Role, Emoji, Strengths, Style
│   └── SOUL.md            # Personality, behavior, style
├── AGENTS.md              # Team overview, routing hints, detailed profiles
├── README.md
├── openclaw-agents-to-merge.json   # Copy into openclaw.json under "agents" key
├── office/                # Layout, map, plan templates (when configured)
│   ├── layout.toon
│   ├── map/
│   │   ├── officemap.tmx
│   │   ├── Room_Builder_Office.tsx
│   │   ├── Modern_Office.tsx
│   │   └── *.png
│   └── plans/
│       └── templates/
│           └── template_*.toon
└── runtime/
    ├── config.toon
    └── .env.example
```

## office/layout.toon

Full OfficeLayout serialized with all settings:
- `width`, `height` – grid dimensions
- `layers` – floor + furniture tiles
- `roomMask`, `floorMaterial` – preserved for re-editing (room-builder)
- `spots` – desk, chair, meeting, closet with optional `label` per spot
- `collision` – blocked tiles for pathfinding
- `camera` – viewport position and zoom

## Per-Agent Content

Each agent gets `workflow-<id>/IDENTITY.md` and `workflow-<id>/SOUL.md` derived from:

- **Agent fields**: `name`, `role`, `tone`, `spots`, `tools_allowed`, `deps`
- **Optional**: `emoji`, `theme` (for identity customization)

## openclaw-agents-to-merge.json

Copy this block into your `openclaw.json` under the `agents` key. Do not overwrite your existing config.

```json
{
  "agents": {
    "list": [
      {
        "id": "helper",
        "workspace": "./workflow-helper",
        "model": "anthropic/claude-sonnet-4-20250514",
        "identity": { "name": "Helper", "theme": "...", "emoji": "🤖" }
      }
    ]
  }
}
```
