# What to do with the ZIP file?

The ZIP file has been downloaded. Follow the steps below based on your situation.

---

## Starting from scratch (OpenClaw is new or empty)

1. **Find the `.openclaw` folder** on your computer. It may be hidden – enable "show hidden files" in your system settings if needed.

2. **Extract the ZIP file** (double-click it). You will get an `openclaw-office` folder (AgentPack layout, matches free-sample):
   - `agents/<id>/` – IDENTITY.md, SOUL.md per agent
   - `AGENTS.md`, `openclaw-config.json`, `README.md`, `SOUL.md`, `USER.md`, `TOOLS.md`, `MEMORY.md`, `HEARTBEAT.md`
   - `office/` – office layout and TMX map (when configured)
   - `runtime/` – config and environment setup

3. **Copy the entire `openclaw-office` folder** into `.openclaw` – or use it as your OpenClaw workspace root.

4. **Restart OpenClaw** – if it is already open, close and reopen it. If not running yet, start it.

---

## You already have a working OpenClaw with files and activity

> **Important:** Do not extract the ZIP on top of your existing folder – it may overwrite your plans and data.

1. **Make a backup first** – copy your entire `.openclaw` folder to a safe place (e.g. your desktop).

2. **Extract the ZIP to a different folder** (e.g. your desktop), not directly into `.openclaw`.

3. **From the extracted `openclaw-office` folder, copy only:**
   - `agents/` – new agent workspaces (IDENTITY.md, SOUL.md per agent)
   - `AGENTS.md`, `openclaw-config.json`, `SOUL.md` – team and pack config
   - `office/` – new office layout (if present)

   Leave `plans`, `MEMORY.md`, `USER.md` and other data in place – do not overwrite them.

4. **Close and reopen OpenClaw.**
