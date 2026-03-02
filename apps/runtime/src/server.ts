/**
 * Runtime API server
 * GET /state, GET /events, POST /god/task
 * Orchestrator runs in background - picks queued tasks, routes to OpenClaw/Nanobot adapters
 */

import express from "express";
import cors from "cors";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { createDb } from "@openclaw-office/storage";
import {
  Orchestrator,
  registerBuiltinAdapters,
} from "@openclaw-office/agent-control";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(__dirname, "../data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DB_PATH ?? join(dataDir, "office.db");
const db = createDb(dbPath);

registerBuiltinAdapters();
const orchestrator = new Orchestrator({
  db: db as import("@openclaw-office/agent-control").DbLike,
  config: {
    poll_interval_ms: Number(process.env.ORCHESTRATOR_POLL_MS) || 2000,
    max_concurrent_per_adapter: Number(process.env.ORCHESTRATOR_CONCURRENT) || 5,
    adapter_configs: {
      openclaw: {
        baseUrl: process.env.OPENCLAW_URL || "http://localhost:3000",
      },
    },
  },
});
orchestrator.start();

const app = express();
app.use(cors());
app.use(express.json());

// GET /state - agents, plans, tasks
app.get("/api/state", (_req, res) => {
  const agents = db.prepare("SELECT * FROM agents").all();
  const plans = db.prepare("SELECT * FROM plans").all();
  const tasks = db.prepare("SELECT * FROM tasks WHERE status IN ('queued','picked','running')").all();
  res.json({ agents, plans, tasks });
});

// GET /events?since=...
app.get("/api/events", (req, res) => {
  const since = Number(req.query.since ?? 0);
  const rows = db.prepare("SELECT * FROM events WHERE timestamp > ? ORDER BY seq ASC").all(since);
  res.json({ events: rows });
});

// POST /god/task - god mode: assign task directly
app.post("/api/god/task", (req, res) => {
  const { plan_id, agent_id, payload } = req.body;
  if (!plan_id || !agent_id) {
    return res.status(400).json({ error: "plan_id and agent_id required" });
  }
  const task_id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const idempotency_key = task_id;
  const scheduled_at = Date.now();
  db.prepare(
    `INSERT INTO tasks (task_id, plan_id, agent_id, payload, idempotency_key, status, scheduled_at)
     VALUES (?, ?, ?, ?, ?, 'queued', ?)`
  ).run(
    task_id,
    plan_id,
    agent_id,
    JSON.stringify(payload ?? {}),
    idempotency_key,
    scheduled_at
  );
  res.json({ task_id, status: "queued" });
});

const PORT = Number(process.env.PORT ?? 5175);
app.listen(PORT, () => {
  console.log(`Runtime API on http://localhost:${PORT}`);
});
