# ZIP Output Structure

The generated ZIP matches the **free-sample-v1.2.0** AgentPack layout.

## Folder Layout

```
openclaw-office/
├── agents/
│   └── <agent_id>/
│       ├── IDENTITY.md    # Name, Role, Emoji, Strengths, Style
│       └── SOUL.md        # Personality, behavior, style
├── AGENTS.md              # Team overview, setup
├── HEARTBEAT.md           # Empty or tasks for periodic checks
├── MEMORY.md              # Long-term memory template
├── openclaw-channels.template.json5
├── openclaw-config.json   # agents.list: id, workspace, model, identity
├── README.md
├── SOUL.md                # Pack defaults (shared principles)
├── TOOLS.md               # Environment notes
├── USER.md                # User profile template
├── office/                # (optional, when layout configured)
│   ├── layout.toon
│   └── rpgjs/
│       ├── officemap.tmx
│       ├── Room_Builder_Office.tsx
│       ├── Modern_Office.tsx
│       └── *.png
├── plans/templates/       # (optional)
└── runtime/               # (optional)
    ├── config.toon
    └── .env.example
```

## Per-Agent Content

Each agent gets `agents/<id>/IDENTITY.md` and `agents/<id>/SOUL.md` derived from:

- **Agent fields**: `name`, `role`, `tone`, `spots`, `tools_allowed`, `deps`
- **Optional**: `emoji`, `theme` (for identity customization)

## openclaw-config.json

```json
{
  "agents": {
    "list": [
      {
        "id": "helper",
        "workspace": "./agents/helper",
        "model": "anthropic/claude-sonnet-4-20250514",
        "identity": { "name": "Helper", "theme": "...", "emoji": "🤖" }
      }
    ]
  }
}
```
