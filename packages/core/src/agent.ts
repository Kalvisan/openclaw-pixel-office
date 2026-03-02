/**
 * Agent definition - from agents/<agent_id>.toon
 */

export interface CharacterAppearance {
  body: string;
  outfit: string;
  hair: string;
  eyes: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  daily_checklist: string[];
  tools_allowed: string[];
  tone: string;
  context_budget_tokens: number;
  escalation_rules: Record<string, unknown>;
  deps: string[]; // DAG dependencies
  /** @deprecated Use character instead */
  sprite?: string;
  character?: CharacterAppearance; // body, outfit, hair, eyes
  spots: string[]; // desk, chair, meeting
  /** Emoji for AgentPack identity (e.g. 🤖) */
  emoji?: string;
  /** Theme/description for AgentPack identity */
  theme?: string;
}

export const AGENT_SCHEMA = {
  type: "map" as const,
  required: ["id", "name", "role", "spots"],
  properties: {
    id: { type: "string" as const },
    name: { type: "string" as const },
    role: { type: "string" as const },
    daily_checklist: { type: "list" as const, items: { type: "string" as const } },
    tools_allowed: { type: "list" as const, items: { type: "string" as const } },
    tone: { type: "string" as const },
    context_budget_tokens: { type: "int" as const },
    escalation_rules: { type: "map" as const },
    deps: { type: "list" as const, items: { type: "string" as const } },
    sprite: { type: "string" as const },
    character: { type: "map" as const },
    spots: { type: "list" as const, items: { type: "string" as const } },
    emoji: { type: "string" as const },
    theme: { type: "string" as const },
  },
};
