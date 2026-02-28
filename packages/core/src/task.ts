/**
 * Task - unit of work for orchestrator, at-least-once delivery with idempotency
 */

export type TaskStatus = "queued" | "picked" | "running" | "done" | "failed";

export interface Task {
  task_id: string;
  plan_id: string;
  agent_id: string;
  payload: Record<string, unknown>;
  status: TaskStatus;
  idempotency_key: string; // task_id for dedup
  scheduled_at: number;
  picked_at?: number;
  done_at?: number;
  result?: Record<string, unknown>;
  error?: string;
}
