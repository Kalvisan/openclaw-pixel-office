/**
 * Cooperative lease lock for plans
 * Acquire: UPDATE plans SET lock_owner=?, lock_until=? WHERE plan_id=? AND (lock_owner IS NULL OR lock_until < now)
 * Renew: only if lock_owner matches
 * Release: lock_owner=NULL, lock_until=NULL
 */

import type Database from "better-sqlite3";

export interface LockResult {
  acquired: boolean;
  owner?: string;
  lease_until?: number;
}

const DEFAULT_LEASE_MS = 5 * 60 * 1000; // 5 minutes

export function acquireLock(
  db: Database.Database,
  planId: string,
  agentId: string,
  leaseMs = DEFAULT_LEASE_MS
): LockResult {
  const now = Date.now();
  const leaseUntil = now + leaseMs;
  const stmt = db.prepare(`
    UPDATE plans
    SET lock_owner = ?, lock_until = ?
    WHERE plan_id = ? AND (lock_owner IS NULL OR lock_until < ?)
  `);
  const result = stmt.run(agentId, leaseUntil, planId, now);
  if (result.changes > 0) {
    return { acquired: true, owner: agentId, lease_until: leaseUntil };
  }
  const row = db.prepare("SELECT lock_owner, lock_until FROM plans WHERE plan_id = ?").get(planId) as
    | { lock_owner: string; lock_until: number }
    | undefined;
  return {
    acquired: false,
    owner: row?.lock_owner,
    lease_until: row?.lock_until,
  };
}

export function renewLock(
  db: Database.Database,
  planId: string,
  agentId: string,
  leaseMs = DEFAULT_LEASE_MS
): boolean {
  const now = Date.now();
  const leaseUntil = now + leaseMs;
  const stmt = db.prepare(`
    UPDATE plans
    SET lock_until = ?
    WHERE plan_id = ? AND lock_owner = ?
  `);
  const result = stmt.run(leaseUntil, planId, agentId);
  return result.changes > 0;
}

export function releaseLock(db: Database.Database, planId: string, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE plans
    SET lock_owner = NULL, lock_until = NULL
    WHERE plan_id = ? AND lock_owner = ?
  `);
  const result = stmt.run(planId, agentId);
  return result.changes > 0;
}
