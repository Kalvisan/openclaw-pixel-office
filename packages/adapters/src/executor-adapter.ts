/**
 * ExecutorAdapter - abstraction for multiple backends (OpenClaw, Nanobot, etc.)
 */

import type { Task } from "@openclaw-office/core";

export interface TaskRun {
  task_run_id: string;
  status: "pending" | "running" | "done" | "failed";
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExecutorAdapter {
  submitTask(task: Task): Promise<string>; // returns task_run_id
  getTaskStatus(taskRunId: string): Promise<TaskRun>;
  fetchResult(taskRunId: string): Promise<Record<string, unknown> | null>;
  cancelTask?(taskRunId: string): Promise<void>;
  capabilities(): Promise<string[]>; // tools list
}
