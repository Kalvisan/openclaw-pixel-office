/**
 * Zip generator - creates openclaw-office project structure
 * Used by site builder
 */

import { strToU8, zipSync, type Zippable } from "fflate";
import { serialize } from "@openclaw-office/toon";
import type { Agent } from "@openclaw-office/core";

const INSTALL_MD = `# OpenClaw Pixel Office - Installation

## Quick start

1. \`git clone\` this repo or extract the zip
2. Copy \`.env.example\` to \`.env\` and configure OpenClaw endpoint
3. \`pnpm install && pnpm build\`
4. \`pnpm dev\` to start runtime

## OpenClaw endpoint

Set \`OPENCLAW_URL\` in .env (e.g. http://localhost:3000)

## Structure

- \`agents/\` - Agent definitions (.toon)
- \`plans/templates/\` - Plan templates
- \`runtime/\` - Config and docker-compose (optional)
- \`ui/\` - Runtime build output
`;

export interface OfficeLayout {
  width: number;
  height: number;
  tiles: string[][];
  spots?: Record<string, { x: number; y: number }[]>;
}

export interface ZipConfig {
  agents: Agent[];
  planTemplates?: Record<string, unknown>[];
  runtimeConfig?: Record<string, unknown>;
  officeLayout?: OfficeLayout;
}

export function generateZip(config: ZipConfig): Uint8Array {
  const files: Zippable = {};
  const prefix = "openclaw-office/";

  // Agents
  for (const agent of config.agents) {
    const path = `${prefix}agents/${agent.id}.toon`;
    files[path] = strToU8(toonAgent(agent));
  }

  // Plan templates
  if (config.planTemplates?.length) {
    for (let i = 0; i < config.planTemplates.length; i++) {
      const t = config.planTemplates[i];
      const path = `${prefix}plans/templates/template_${i}.toon`;
      files[path] = strToU8(serialize(t));
    }
  }

  // Office layout (custom map)
  if (config.officeLayout) {
    files[`${prefix}office/layout.toon`] = strToU8(serialize(config.officeLayout));
  }

  // Runtime config
  const configToon = config.runtimeConfig ?? {
    openclaw_url: "http://localhost:3000",
    feature_flags: {},
  };
  files[`${prefix}runtime/config.toon`] = strToU8(serialize(configToon));
  files[`${prefix}runtime/.env.example`] = strToU8(
    "OPENCLAW_URL=http://localhost:3000\n"
  );

  // INSTALL.md
  files[`${prefix}INSTALL.md`] = strToU8(INSTALL_MD);

  return zipSync(files, { level: 6 });
}

function toonAgent(a: Agent): string {
  const payload: Record<string, unknown> = {
    id: a.id,
    name: a.name,
    role: a.role,
    daily_checklist: a.daily_checklist ?? [],
    tools_allowed: a.tools_allowed ?? [],
    tone: a.tone ?? "professional",
    context_budget_tokens: a.context_budget_tokens ?? 4096,
    escalation_rules: a.escalation_rules ?? {},
    deps: a.deps ?? [],
    spots: [],
  };
  if (a.character) payload.character = a.character;
  else if (a.sprite) payload.sprite = a.sprite;
  return serialize(payload);
}
