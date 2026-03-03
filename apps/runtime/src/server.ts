/**
 * Runtime API server
 * GET /state, GET /events, GET /live-office, GET/POST /config, POST /god/task
 * Orchestrator runs in background. Gateway token = single config for full OpenClaw integration.
 */

import express from "express";
import cors from "cors";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { createDb } from "@openclaw-office/storage";
import {
  Orchestrator,
  registerBuiltinAdapters,
} from "@openclaw-office/agent-control";
import {
  buildLiveOfficeState,
  type TaskRow,
} from "@openclaw-office/runtime-live-office";
import { connectGateway, callGateway, type GatewayWebSocket } from "@openclaw-office/gateway-client";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dataDir = join(__dirname, "../data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DB_PATH ?? join(dataDir, "office.db");
const db = createDb(dbPath);
const configPath = join(dataDir, "config.json");

interface RuntimeConfig {
  gatewayToken?: string;
  gatewayUrl?: string;
}

function loadConfig(): RuntimeConfig {
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf-8")) as RuntimeConfig;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveConfig(cfg: RuntimeConfig): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

const runtimeConfig = loadConfig();
if (runtimeConfig.gatewayToken) {
  process.env.OPENCLAW_GATEWAY_TOKEN = runtimeConfig.gatewayToken;
}

let gatewayWs: GatewayWebSocket | null = null;
let gatewayStatus: unknown = null;

async function tryGatewayConnection() {
  const cfg = loadConfig();
  if (!cfg.gatewayToken) return;
  const url = (cfg.gatewayUrl ?? "ws://localhost:18789").replace(/^http/, "ws");
  try {
    if (gatewayWs) {
      gatewayWs.close();
      gatewayWs = null;
      gatewayStatus = null;
    }
    const ws = await connectGateway({
      token: cfg.gatewayToken,
      url,
    });
    gatewayWs = ws;
    try {
      gatewayStatus = await callGateway(ws, "status", {});
    } catch {
      gatewayStatus = { connected: true };
    }
    ws.on("close", () => {
      gatewayWs = null;
      gatewayStatus = null;
      console.log("[Runtime] Gateway disconnected");
      setTimeout(tryGatewayConnection, 5000);
    });
    console.log("[Runtime] Gateway connected");
  } catch (err) {
    console.warn("[Runtime] Gateway connect failed:", (err as Error).message);
  }
}

tryGatewayConnection();

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

// GET /config - current config (token masked)
app.get("/api/config", (_req, res) => {
  const cfg = loadConfig();
  res.json({
    gatewayUrl: cfg.gatewayUrl ?? "ws://localhost:18789",
    hasToken: !!cfg.gatewayToken,
    gatewayConnected: !!gatewayWs,
    gatewayStatus: gatewayStatus ?? null,
  });
});

// POST /config - save gateway token and URL
app.post("/api/config", async (req, res) => {
  const { gatewayToken, gatewayUrl } = req.body as { gatewayToken?: string; gatewayUrl?: string };
  const cfg = loadConfig();
  if (typeof gatewayToken === "string") cfg.gatewayToken = gatewayToken;
  if (typeof gatewayUrl === "string") cfg.gatewayUrl = gatewayUrl;
  saveConfig(cfg);
  if (cfg.gatewayToken) process.env.OPENCLAW_GATEWAY_TOKEN = cfg.gatewayToken;
  await tryGatewayConnection();
  res.json({ ok: true });
});

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

// GET /live-office - agent positions for 2D simulation (tasks → AgentSim)
app.get("/api/live-office", (_req, res) => {
  const tasks = db.prepare(
    `SELECT task_id, agent_id, status FROM tasks WHERE status IN ('queued','picked','running','done') ORDER BY picked_at DESC`
  ).all() as TaskRow[];

  const agentIdsFromTasks = [...new Set(tasks.map((t) => t.agent_id))];
  const agentIdsFromDb = (
    db.prepare("SELECT id FROM agents").all() as { id: string }[]
  ).map((r) => r.id);
  const agentIds = [...new Set([...agentIdsFromTasks, ...agentIdsFromDb])];

  const state = buildLiveOfficeState(tasks, agentIds);
  res.json(state);
});

// POST /api/demo/seed - create demo plan + task for live office (no OpenClaw needed)
app.post("/api/demo/seed", (_req, res) => {
  const now = Date.now();
  const planId = `plan_demo_${now}`;
  const taskId = `task_demo_${now}`;
  try {
    db.prepare(
      `INSERT OR IGNORE INTO plans (plan_id, title, created_at, updated_at, owner_agent_id, status)
       VALUES (?, ?, ?, ?, 'ceo', 'active')`
    ).run(planId, "Demo plan", now, now);
    db.prepare(
      `INSERT INTO tasks (task_id, plan_id, agent_id, payload, idempotency_key, status, scheduled_at, picked_at)
       VALUES (?, ?, ?, '{}', ?, 'running', ?, ?)`
    ).run(taskId, planId, "dev", taskId, now, now);
    res.json({ plan_id: planId, task_id: taskId, status: "running" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
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
