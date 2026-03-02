import { useState, useEffect, useMemo } from "react";
import { AgentEditor } from "./AgentEditor";
import { DownloadZip } from "./DownloadZip";
import type { Agent } from "@openclaw-office/core";
import { generateOfficeLayoutFromAgents } from "./layoutPresets";
import { DEFAULT_CHARACTER } from "./characterAssets";

const BASE_AGENT = {
  daily_checklist: [] as string[],
  tools_allowed: [] as string[],
  tone: "professional",
  context_budget_tokens: 4096,
  escalation_rules: {} as Record<string, unknown>,
};

const PRESETS = {
  virtual_it_agency: {
    name: "Virtual IT Agency",
    agents: [
      { ...BASE_AGENT, id: "ceo", name: "James", role: "Chief Executive", character: { ...DEFAULT_CHARACTER, outfit: "outfit_1", hair: "hair_5" }, spots: ["desk", "meeting"], deps: [] },
      { ...BASE_AGENT, id: "pm", name: "Sarah", role: "Project Manager", character: { ...DEFAULT_CHARACTER, outfit: "outfit_2", hair: "hair_10" }, spots: ["desk", "meeting"], deps: ["ceo"] },
      { ...BASE_AGENT, id: "dev", name: "Mike", role: "Developer", character: { ...DEFAULT_CHARACTER, outfit: "outfit_3", hair: "hair_15" }, spots: ["desk"], deps: ["pm"], tools_allowed: ["read_file", "write_file", "run_terminal"], tone: "technical", context_budget_tokens: 8192 },
      { ...BASE_AGENT, id: "qa", name: "Lisa", role: "QA Engineer", character: { ...DEFAULT_CHARACTER, outfit: "outfit_4", hair: "hair_20" }, spots: ["desk"], deps: ["dev"], tools_allowed: ["read_file", "run_terminal"], tone: "analytical" },
      { ...BASE_AGENT, id: "designer", name: "Emma", role: "UI/UX Designer", character: { ...DEFAULT_CHARACTER, outfit: "outfit_5", hair: "hair_25" }, spots: ["desk"], deps: ["pm"], tools_allowed: ["read_file", "write_file"], tone: "creative" },
      { ...BASE_AGENT, id: "researcher", name: "Alex", role: "Research", character: { ...DEFAULT_CHARACTER, outfit: "outfit_6", hair: "hair_30" }, spots: ["desk", "chair"], deps: ["pm"], tools_allowed: ["read_file", "web_search"], tone: "curious", context_budget_tokens: 8192 },
    ] as Agent[],
  },
};

export default function App() {
  const [preset, setPreset] = useState<keyof typeof PRESETS | null>("virtual_it_agency");
  const [agents, setAgents] = useState<Agent[]>(
    preset ? [...PRESETS[preset].agents] : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Auto-generated layout: empty floor + spots (desk, chair, closet, meeting) from agent count
  const officeLayout = useMemo(
    () => generateOfficeLayoutFromAgents(agents),
    [agents]
  );

  useEffect(() => {
    if (preset) {
      setAgents([...PRESETS[preset].agents]);
      setSelectedId(PRESETS[preset].agents[0]?.id ?? null);
    }
  }, [preset]);

  const applyPreset = (key: string) => {
    if (key in PRESETS) {
      const k = key as keyof typeof PRESETS;
      setPreset(k);
      setAgents([...PRESETS[k].agents]);
      setSelectedId(PRESETS[k].agents[0]?.id ?? null);
    }
  };

  return (
    <>
      <div className="app-container">
      <header className="app-header">
        <h1 className="game-font-title">OpenClaw Office</h1>
        <p className="app-tagline">
          Build your virtual office: pick a team preset, customize each agent (body, outfit, hair, face),
          define who reports to whom. Layout and spots (desk, chair, closet, meeting) are auto-generated from your team.
          Export a ready-to-deploy zip. No login. Runs in browser.
        </p>
      </header>

      {preset && (
        <>
          <section className="app-section">
            <AgentEditor
              presetPresets={Object.entries(PRESETS).map(([k, v]) => ({ id: k, name: v.name }))}
              presetSelected={preset}
              onPresetSelect={applyPreset}
              agents={agents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={setAgents}
            />
          </section>

          <section className="app-section">
            <DownloadZip agents={agents} officeLayout={officeLayout} />
          </section>
        </>
      )}

      <footer className="app-footer">
        Pixel art: <a href="https://limezu.itch.io/" target="_blank" rel="noopener noreferrer">LimeZu</a> (Modern Office Revamped, MV Character Generator)
      </footer>
    </div>
    </>
  );
}
