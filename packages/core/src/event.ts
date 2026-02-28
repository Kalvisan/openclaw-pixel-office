/**
 * Event types - append-only log, source of truth for visualization
 */

export type EventType =
  | "PLAN_CREATED"
  | "LOCK_ACQUIRED"
  | "LOCK_RELEASED"
  | "TODO_CHECKED"
  | "HANDOFF_REQUESTED"
  | "HANDOFF_DELIVERED"
  | "BLOCKED"
  | "DONE";

export interface BaseEvent {
  event_id: string;
  event_type: EventType;
  timestamp: number; // unix ms
  plan_id?: string;
  agent_id?: string;
}

export interface PlanCreatedEvent extends BaseEvent {
  event_type: "PLAN_CREATED";
  plan_id: string;
  agent_id: string;
  payload?: Record<string, unknown>;
}

export interface LockAcquiredEvent extends BaseEvent {
  event_type: "LOCK_ACQUIRED";
  plan_id: string;
  agent_id: string;
  payload?: { lease_until: number };
}

export interface TodoCheckedEvent extends BaseEvent {
  event_type: "TODO_CHECKED";
  plan_id: string;
  agent_id: string;
  payload?: { todo_index: number; status: string };
}

export interface HandoffRequestedEvent extends BaseEvent {
  event_type: "HANDOFF_REQUESTED";
  plan_id: string;
  agent_id: string;
  payload?: { to_agent_id: string; reason: string };
}

export interface HandoffDeliveredEvent extends BaseEvent {
  event_type: "HANDOFF_DELIVERED";
  plan_id: string;
  agent_id: string;
  payload?: { from_agent_id: string };
}

export interface BlockedEvent extends BaseEvent {
  event_type: "BLOCKED";
  plan_id: string;
  agent_id?: string;
  payload?: { reason: string };
}

export interface DoneEvent extends BaseEvent {
  event_type: "DONE";
  plan_id: string;
  agent_id?: string;
}

export type Event =
  | PlanCreatedEvent
  | LockAcquiredEvent
  | TodoCheckedEvent
  | HandoffRequestedEvent
  | HandoffDeliveredEvent
  | BlockedEvent
  | DoneEvent;
