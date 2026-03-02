/**
 * Orchestrator - central controller for agent task execution
 * Runs in OpenClaw instance. Picks queued tasks, routes to adapters, updates status.
 */

import type { Task } from "@openclaw-office/core";
import type { DbLike } from "./data-processor.js";
import { getAdapter } from "./adapter-registry.js";
import { processDataPacket } from "./data-processor.js";
import type { OrchestratorConfig, AdapterType, DataPacket } from "./types.js";

export interface OrchestratorDeps {
  db: DbLike;
  config?: OrchestratorConfig;
  onTaskDone?: (taskId: string, result: Record<string, unknown>) => void;
  onTaskFailed?: (taskId: string, error: string) => void;
}

/** Resolve adapter type for agent */
function getAdapterTypeForAgent(
  agentId: string,
  agentAdapters?: Record<string, AdapterType>
): AdapterType {
  return agentAdapters?.[agentId] ?? "openclaw";
}

/** Main orchestrator loop - pick queued tasks, submit to adapter, poll status */
export class Orchestrator {
  private deps: OrchestratorDeps;
  private running = new Map<string, string>(); // task_id -> task_run_id
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(deps: OrchestratorDeps) {
    this.deps = deps;
  }

  /** Start polling for queued tasks */
  start(): void {
    const interval = this.deps.config?.poll_interval_ms ?? 2000;
    const maxConcurrent =
      this.deps.config?.max_concurrent_per_adapter ?? 5;

    this.pollTimer = setInterval(() => {
      this.tick(maxConcurrent);
    }, interval);
  }

  /** Stop orchestrator */
  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Single tick: pick tasks, submit, poll running */
  async tick(maxConcurrent: number): Promise<void> {
    const { db, config } = this.deps;
    const agentAdapters = config?.agent_adapters;

    // Poll status of running tasks
    for (const [taskId, taskRunId] of this.running) {
      const row = (db.prepare(
        "SELECT agent_id FROM tasks WHERE task_id = ?"
      ).all(taskId) as Array<{ agent_id: string }>)[0];
      if (!row) continue;

      const adapterType = getAdapterTypeForAgent(row.agent_id, agentAdapters);
      const adapterConfig = config?.adapter_configs?.[adapterType];
      const adapter = getAdapter(adapterType, adapterConfig);
      if (!adapter) continue;

      try {
        const status = await adapter.getTaskStatus(taskRunId);
        if (status.status === "done") {
          const result = (await adapter.fetchResult(taskRunId)) ?? {};
          this.completeTask(taskId, result);
          this.running.delete(taskId);
        } else if (status.status === "failed") {
          this.failTask(taskId, status.error ?? "Unknown error");
          this.running.delete(taskId);
        }
      } catch (err) {
        console.error(`[Orchestrator] Poll failed for ${taskId}:`, err);
      }
    }

    // Pick new queued tasks (respect concurrency)
    const runningCount = this.running.size;
    if (runningCount >= maxConcurrent) return;

    const queued = db.prepare(
      `SELECT task_id, plan_id, agent_id, payload, idempotency_key, scheduled_at
       FROM tasks WHERE status = 'queued' ORDER BY scheduled_at ASC LIMIT ?`
    ).all(maxConcurrent - runningCount) as Array<{
      task_id: string;
      plan_id: string;
      agent_id: string;
      payload: string;
      idempotency_key: string;
      scheduled_at: number;
    }>;

    for (const row of queued) {
      const adapterType = getAdapterTypeForAgent(row.agent_id, agentAdapters);
      const adapterConfig = config?.adapter_configs?.[adapterType];
      const adapter = getAdapter(adapterType, adapterConfig);
      if (!adapter) {
        console.warn(`[Orchestrator] No adapter for type ${adapterType}, skipping ${row.task_id}`);
        continue;
      }

      const task: Task = {
        task_id: row.task_id,
        plan_id: row.plan_id,
        agent_id: row.agent_id,
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        idempotency_key: row.idempotency_key,
        status: "queued",
        scheduled_at: row.scheduled_at,
      };

      try {
        const taskRunId = await adapter.submitTask(task);
        db.prepare(
          `UPDATE tasks SET status = 'running', picked_at = ? WHERE task_id = ?`
        ).run(Date.now(), row.task_id);
        this.running.set(row.task_id, taskRunId);
      } catch (err) {
        console.error(`[Orchestrator] Submit failed for ${row.task_id}:`, err);
        this.failTask(row.task_id, String(err));
      }
    }
  }

  private completeTask(taskId: string, result: Record<string, unknown>): void {
    const { db } = this.deps;
    db.prepare(
      `UPDATE tasks SET status = 'done', done_at = ?, result = ? WHERE task_id = ?`
    ).run(Date.now(), JSON.stringify(result), taskId);
    this.deps.onTaskDone?.(taskId, result);
  }

  private failTask(taskId: string, error: string): void {
    const { db } = this.deps;
    db.prepare(
      `UPDATE tasks SET status = 'failed', done_at = ?, error = ? WHERE task_id = ?`
    ).run(Date.now(), error, taskId);
    this.deps.onTaskFailed?.(taskId, error);
  }

  /** Process data packet (memory, handoff, etc.) - called by adapters or external */
  processData(packet: DataPacket): void {
    processDataPacket({ db: this.deps.db }, packet);
  }
}
