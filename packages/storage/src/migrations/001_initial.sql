-- OpenClaw Pixel Office - Initial schema
-- Event log is source of truth for visualization
-- At-least-once delivery with idempotency for task queue

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  daily_checklist TEXT, -- JSON array
  tools_allowed TEXT,   -- JSON array
  tone TEXT,
  context_budget_tokens INTEGER DEFAULT 4096,
  escalation_rules TEXT, -- JSON
  deps TEXT,             -- JSON array
  sprite TEXT NOT NULL,
  spots TEXT NOT NULL,   -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  plan_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  owner_agent_id TEXT NOT NULL,
  lock_owner TEXT,
  lock_until INTEGER,
  goal_bullets TEXT,     -- JSON array
  goal_acceptance_tests TEXT, -- JSON array
  todo TEXT,             -- JSON array
  execution_notes TEXT,
  artifacts TEXT,        -- JSON array
  handoffs TEXT,         -- JSON array
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS plan_revisions (
  plan_id TEXT NOT NULL,
  rev_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  author_agent_id TEXT NOT NULL,
  snapshot TEXT NOT NULL, -- JSON
  PRIMARY KEY (plan_id, rev_id),
  FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  payload TEXT NOT NULL,  -- JSON
  idempotency_key TEXT NOT NULL UNIQUE,
  scheduled_at INTEGER NOT NULL,
  picked_at INTEGER,
  done_at INTEGER,
  result TEXT,            -- JSON
  error TEXT,
  status TEXT DEFAULT 'queued',
  FOREIGN KEY (plan_id) REFERENCES plans(plan_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_at);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  plan_id TEXT,
  agent_id TEXT,
  payload TEXT,          -- JSON
  seq INTEGER            -- append order
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_plan ON events(plan_id);
CREATE INDEX IF NOT EXISTS idx_events_seq ON events(seq);

CREATE TABLE IF NOT EXISTS memory_items (
  key TEXT PRIMARY KEY,
  summary_compact TEXT NOT NULL,
  details_compact TEXT,
  source_refs TEXT,      -- JSON array
  updated_at INTEGER NOT NULL,
  confidence REAL
);

CREATE TABLE IF NOT EXISTS retention_jobs (
  job_id TEXT PRIMARY KEY,
  plan_id TEXT,
  run_at INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  result TEXT
);
