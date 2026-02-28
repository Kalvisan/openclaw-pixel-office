/**
 * Agent state machine for 2D office
 * idle -> sofa
 * working -> desk + type/read animation
 * deliver -> walk to colleague desk + stacked papers
 * pickup -> walk to locker + pick plan
 * meeting -> meeting spot
 */

export type AgentSimState =
  | "idle"
  | "working"
  | "deliver"
  | "pickup"
  | "meeting";

export interface AgentSim {
  agent_id: string;
  state: AgentSimState;
  x: number;
  y: number;
  target_x?: number;
  target_y?: number;
  path?: { x: number; y: number }[];
  plan_id_in_hands?: string;
  desk_x?: number;
  desk_y?: number;
}
