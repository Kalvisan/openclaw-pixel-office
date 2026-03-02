/**
 * Adapter Registry - pluggable agent backends (OpenClaw, Nanobot, etc.)
 * Registers adapter factories by type. Orchestrator uses this to route tasks.
 */

import type { ExecutorAdapter } from "@openclaw-office/adapters";
import { OpenClawAdapter } from "@openclaw-office/adapters";
import type { AdapterType, AdapterFactory } from "./types.js";

const registry = new Map<AdapterType, AdapterFactory>();

/** Register adapter factory for a type */
export function registerAdapter(type: AdapterType, factory: AdapterFactory): void {
  registry.set(type, factory);
}

/** Get adapter instance for agent. Returns null if type unknown. */
export function getAdapter(
  type: AdapterType,
  config?: Record<string, unknown>
): ExecutorAdapter | null {
  const factory = registry.get(type);
  return factory ? factory(type, config) : null;
}

function getEnv(name: string): string | undefined {
  try {
    const g = globalThis as { process?: { env?: Record<string, string> } };
    return g.process?.env?.[name];
  } catch {
    return undefined;
  }
}

/** Create default OpenClaw adapter */
function createOpenClawAdapter(
  _type: AdapterType,
  config?: Record<string, unknown>
): ExecutorAdapter {
  const baseUrl =
    (config?.baseUrl as string) ??
    getEnv("OPENCLAW_URL") ??
    "http://localhost:3000";
  return new OpenClawAdapter({ baseUrl });
}

/** Stub Nanobot adapter - returns placeholder. Implement when nanobot API exists. */
function createNanobotAdapter(
  _type: AdapterType,
  _config?: Record<string, unknown>
): ExecutorAdapter | null {
  // TODO: Implement NanobotAdapter when API is available
  return null;
}

/** Register built-in adapters */
export function registerBuiltinAdapters(): void {
  registerAdapter("openclaw", createOpenClawAdapter);
  registerAdapter("nanobot", createNanobotAdapter);
}

/** List registered adapter types */
export function getRegisteredTypes(): AdapterType[] {
  return Array.from(registry.keys());
}
