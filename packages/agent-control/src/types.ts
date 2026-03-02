/**
 * Agent Control - types for orchestrator and data flow
 */

import type { Task } from "@openclaw-office/core";
import type { ExecutorAdapter } from "@openclaw-office/adapters";

/** Adapter type identifier - used to route tasks to the correct backend */
export type AdapterType = "openclaw" | "nanobot" | string;

/** Agent runtime config - which adapter handles this agent */
export interface AgentAdapterConfig {
  agent_id: string;
  adapter_type: AdapterType;
  /** Adapter-specific config (e.g. baseUrl for OpenClaw) */
  config?: Record<string, unknown>;
}

/** Orchestrator config - runs inside OpenClaw instance */
export interface OrchestratorConfig {
  /** Map agent_id -> adapter_type. Default: "openclaw" */
  agent_adapters?: Record<string, AdapterType>;
  /** Poll interval for queued tasks (ms) */
  poll_interval_ms?: number;
  /** Max concurrent tasks per adapter */
  max_concurrent_per_adapter?: number;
  /** Adapter configs by type. E.g. openclaw: { baseUrl: "http://localhost:3000" } */
  adapter_configs?: Record<string, Record<string, unknown>>;
}

/** Data packet passed between agents (memory, handoffs, artifacts) */
export interface DataPacket {
  from_agent_id?: string;
  to_agent_id?: string;
  plan_id: string;
  type: "memory" | "handoff" | "artifact" | "event";
  payload: Record<string, unknown>;
  timestamp: number;
}

/** Adapter factory - creates adapter instance by type */
export type AdapterFactory = (
  type: AdapterType,
  config?: Record<string, unknown>
) => ExecutorAdapter | null;

/** Task with runtime context for orchestrator */
export interface OrchestratorTask extends Task {
  adapter_type: AdapterType;
  task_run_id?: string;
}
