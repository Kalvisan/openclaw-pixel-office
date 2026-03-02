/**
 * Data Processor - inter-agent data flow
 * Handles memory, handoffs, artifacts. Writes to storage, emits events.
 */

import type { DataPacket } from "./types.js";

/** Minimal DB interface for data processor - compatible with better-sqlite3 */
export interface DbLike {
  prepare(sql: string): {
    run(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
  };
}

export interface DataProcessorConfig {
  db: DbLike;
  onEvent?: (event: DataPacket) => void;
}

/** Process data packet: persist to storage, emit event */
export function processDataPacket(
  config: DataProcessorConfig,
  packet: DataPacket
): void {
  const { db, onEvent } = config;

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const payloadStr = JSON.stringify(packet.payload);

  db.prepare(
    `INSERT INTO events (event_id, event_type, timestamp, plan_id, agent_id, payload, seq)
     VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM events))`
  ).run(
    eventId,
    packet.type,
    packet.timestamp,
    packet.plan_id,
    packet.from_agent_id ?? packet.to_agent_id ?? null,
    payloadStr
  );

  if (packet.type === "memory") {
    const key = packet.payload.key as string;
    const summary = (packet.payload.summary_compact as string) ?? "";
    const details = (packet.payload.details_compact as string) ?? null;
    const sourceRefs = packet.payload.source_refs
      ? JSON.stringify(packet.payload.source_refs)
      : null;
    const confidence = (packet.payload.confidence as number) ?? null;

    db.prepare(
      `INSERT OR REPLACE INTO memory_items (key, summary_compact, details_compact, source_refs, updated_at, confidence)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(key, summary, details ?? "", sourceRefs, packet.timestamp, confidence);
  }

  onEvent?.(packet);
}

/** Fetch memory for agent context (compact summary) */
export function getMemoryContext(db: DbLike, limit = 20): string[] {
  const rows = db
    .prepare(
      `SELECT key, summary_compact FROM memory_items ORDER BY updated_at DESC LIMIT ?`
    )
    .all(limit) as Array<{ key: string; summary_compact: string }>;
  return rows.map((r) => `[${r.key}] ${r.summary_compact}`);
}
