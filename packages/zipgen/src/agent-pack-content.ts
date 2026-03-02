/**
 * Generate IDENTITY.md and SOUL.md content from Agent data
 */

import type { Agent } from "@openclaw-office/core";

const TONE_TO_STRENGTHS: Record<string, string[]> = {
  professional: ["Clear communication", "Reliable execution", "Structured thinking"],
  technical: ["Code review", "Debugging", "Architecture"],
  analytical: ["Data analysis", "Quality assurance", "Systematic testing"],
  creative: ["Design thinking", "User experience", "Visual communication"],
  curious: ["Research", "Exploration", "Synthesis"],
  friendly: ["Collaboration", "Support", "Empathy"],
};

function getStrengths(a: Agent): string[] {
  const fromTone = TONE_TO_STRENGTHS[a.tone ?? "professional"] ?? TONE_TO_STRENGTHS.professional;
  const fromTools =
    (a.tools_allowed ?? []).length > 0
      ? [`Tools: ${(a.tools_allowed ?? []).join(", ")}`]
      : [];
  return [...fromTone, ...fromTools];
}

/** Generate IDENTITY.md content for an agent */
export function agentToIdentityMd(a: Agent): string {
  const emoji = a.emoji ?? "🤖";
  const strengths = getStrengths(a);
  const style = a.theme ?? `${a.tone ?? "professional"} tone, ${(a.spots ?? []).join("/")} spots`;

  return `# ${a.name}

- **Role:** ${a.role}
- **Emoji:** ${emoji}
- **Strengths:** ${strengths.join(", ")}
- **Style:** ${style}
`;
}

/** Generate SOUL.md content for an agent */
export function agentToSoulMd(a: Agent): string {
  const tone = a.tone ?? "professional";
  const deps = (a.deps ?? []).length > 0 ? (a.deps ?? []).join(", ") : "none";
  const spots = (a.spots ?? []).join(", ") || "desk";

  return `# SOUL — ${a.name}

## Personality

- **Tone:** ${tone}
- **Collaborates with:** ${deps}
- **Works at:** ${spots}

## Behavior

- Follows pack defaults in root SOUL.md
- Uses tools when appropriate: ${(a.tools_allowed ?? []).join(", ") || "none"}

## Style

- ${a.theme ?? "Matches role and tone"}
`;
}
