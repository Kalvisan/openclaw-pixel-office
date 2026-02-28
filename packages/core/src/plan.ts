/**
 * Plan definition - from plans/<plan_id>/plan.toon
 */

export interface PlanLock {
  owner: string; // agent_id
  lease_until: number; // unix ms
}

export interface PlanGoal {
  bullets: string[];
  acceptance_tests: string[];
}

export interface PlanTodoItem {
  text: string;
  status: "pending" | "in_progress" | "done";
  checked_at?: number; // unix ms
}

export interface PlanHandoff {
  to_agent_id: string;
  reason: string;
  bring_back?: string;
}

export interface Plan {
  plan_id: string;
  title: string;
  created_at: number;
  updated_at: number;
  owner_agent_id: string;
  lock?: PlanLock;
  goal: PlanGoal;
  todo: PlanTodoItem[];
  execution_notes?: string;
  artifacts?: string[];
  handoffs?: PlanHandoff[];
}
