/**
 * OpenClawAdapter - MVP adapter for OpenClaw API
 * Spawns sub-agent run, passes plan snapshot + memory core, reads result
 */

import type { ExecutorAdapter, TaskRun } from "./executor-adapter.js";
import type { Task } from "@openclaw-office/core";

export interface OpenClawConfig {
  baseUrl: string;
}

export class OpenClawAdapter implements ExecutorAdapter {
  constructor(private config: OpenClawConfig) {}

  async submitTask(task: Task): Promise<string> {
    const res = await fetch(`${this.config.baseUrl}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: task.agent_id,
        plan_id: task.plan_id,
        payload: task.payload,
        idempotency_key: task.idempotency_key,
      }),
    });
    if (!res.ok) throw new Error(`OpenClaw submit failed: ${res.status}`);
    const data = (await res.json()) as { run_id: string };
    return data.run_id;
  }

  async getTaskStatus(taskRunId: string): Promise<TaskRun> {
    const res = await fetch(`${this.config.baseUrl}/api/runs/${taskRunId}`);
    if (!res.ok) throw new Error(`OpenClaw status failed: ${res.status}`);
    const data = (await res.json()) as {
      status: string;
      result?: Record<string, unknown>;
      error?: string;
    };
    return {
      task_run_id: taskRunId,
      status: data.status as TaskRun["status"],
      result: data.result,
      error: data.error,
    };
  }

  async fetchResult(taskRunId: string): Promise<Record<string, unknown> | null> {
    const run = await this.getTaskStatus(taskRunId);
    return run.result ?? null;
  }

  async capabilities(): Promise<string[]> {
    const res = await fetch(`${this.config.baseUrl}/api/capabilities`);
    if (!res.ok) return [];
    const data = (await res.json()) as { tools?: string[] };
    return data.tools ?? [];
  }
}
