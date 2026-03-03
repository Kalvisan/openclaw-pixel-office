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
  const reportsTo = (a.deps ?? []).length
    ? (a.deps ?? []).map((id) => `${id}`).join(", ")
    : "(reports directly to you)";

  const roleDescription =
    a.roleSummary ??
    `${a.role} is responsible for driving high‑quality outcomes in their domain, owning day‑to‑day execution and collaborating with the rest of the team.`;

  return `# ${a.name}

- **Role:** ${a.role}
- **Emoji:** ${emoji}
- **Reports to:** ${reportsTo}
- **Primary location:** ${(a.spots ?? []).join(", ") || "desk"}
- **Strengths:** ${strengths.join(", ")}
- **Style:** ${style}

## What this agent does

${roleDescription}
`;
}

/** Generate SOUL.md content for an agent */
export function agentToSoulMd(a: Agent): string {
  const tone = a.tone ?? "professional";
  const deps = (a.deps ?? []).length > 0 ? (a.deps ?? []).join(", ") : "none";
  const spots = (a.spots ?? []).join(", ") || "desk";
  const tools = (a.tools_allowed ?? []).join(", ") || "none";

  const responsibilities =
    a.roleResponsibilities && a.roleResponsibilities.length > 0
      ? a.roleResponsibilities.map((r) => `- ${r}`).join("\n")
      : `- Take end‑to‑end ownership of tasks in your lane.
- Ask clarifying questions when requirements are ambiguous.
- Keep notes of key decisions and rationale.
- Collaborate respectfully with other agents and the user.`;

  const workingStyleIntro =
    a.roleWorkingStyle ??
    "Follow pack defaults in root SOUL.md, then specialize based on your role.";

  return `# SOUL — ${a.name}

## Mission

You are the **${a.role}**.
Your job is to own your domain, make clear recommendations, and keep your manager informed about progress, risks, and decisions.

## Reporting line

- You report to: ${deps !== "none" ? deps : "the user (no intermediate manager)"}
- You proactively surface blockers instead of going silent.

## Responsibilities

${responsibilities}

## Tools & boundaries

- Allowed tools: ${tools}
- Use tools only when they clearly help the current task.
- Never run destructive actions (deletes, overwrites) without explicit confirmation.

## Working style

${workingStyleIntro}

- Default tone: ${tone}
- Work primarily from: ${spots}
`;
}
