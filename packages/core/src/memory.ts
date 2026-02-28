/**
 * Shared memory - compact summaries for context optimization
 */

export interface MemoryItem {
  key: string;
  summary_compact: string;
  details_compact?: string;
  source_refs?: string[]; // files, plan_id, event_id
  updated_at: number;
  confidence?: number;
}
