/**
 * Agent Control - orchestrator for OpenClaw office
 * Manages task routing, adapter registry, data flow between agents.
 */

export { Orchestrator } from "./orchestrator.js";
export {
  registerAdapter,
  registerBuiltinAdapters,
  getAdapter,
  getRegisteredTypes,
} from "./adapter-registry.js";
export { processDataPacket, getMemoryContext } from "./data-processor.js";
export type { DbLike, DataProcessorConfig } from "./data-processor.js";
export type {
  AdapterType,
  AgentAdapterConfig,
  OrchestratorConfig,
  DataPacket,
  AdapterFactory,
  OrchestratorTask,
} from "./types.js";
