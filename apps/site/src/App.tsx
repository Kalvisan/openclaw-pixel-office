import { useState, useEffect } from "react";
import { AgentEditor } from "./AgentEditor";
import { DownloadZip } from "./DownloadZip";
import { LayoutPreview } from "./LayoutPreview";
import type { Agent } from "@openclaw-office/core";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { officeDesignJsonToOfficeLayout } from "@openclaw-office/zipgen";
import { cloneLayout } from "./layoutPresets";
import { LAYOUT_JSON_URL } from "./assets";
import { DEFAULT_CHARACTER } from "./characterAssets";

const BASE_AGENT = {
  daily_checklist: [] as string[],
  tools_allowed: [] as string[],
  tone: "professional",
  context_budget_tokens: 4096,
  escalation_rules: {} as Record<string, unknown>,
};

/** Default CEO when user creates their own team */
const DEFAULT_CEO: Agent = {
  ...BASE_AGENT,
  id: "ceo",
  name: "You",
  role: "Chief Executive",
  emoji: "👔",
  character: { ...DEFAULT_CHARACTER, outfit: "outfit_1", hair: "hair_5" },
  spots: ["desk", "meeting"],
  deps: [],
};

const PRESETS = {
  virtual_it_agency: {
    name: "Virtual IT Agency",
    agents: [
      { ...BASE_AGENT, id: "ceo", name: "James", role: "Chief Executive", emoji: "👔", character: { ...DEFAULT_CHARACTER, outfit: "outfit_1", hair: "hair_5" }, spots: ["desk", "meeting"], deps: [] },
      { ...BASE_AGENT, id: "pm", name: "Sarah", role: "Project Manager", emoji: "📋", character: { ...DEFAULT_CHARACTER, outfit: "outfit_2", hair: "hair_10" }, spots: ["desk", "meeting"], deps: ["ceo"] },
      { ...BASE_AGENT, id: "dev", name: "Mike", role: "Developer", emoji: "💻", character: { ...DEFAULT_CHARACTER, outfit: "outfit_3", hair: "hair_15" }, spots: ["desk"], deps: ["pm"], tools_allowed: ["read_file", "write_file", "run_terminal"], tone: "technical", context_budget_tokens: 8192 },
      { ...BASE_AGENT, id: "qa", name: "Lisa", role: "QA Engineer", emoji: "🔍", character: { ...DEFAULT_CHARACTER, outfit: "outfit_4", hair: "hair_20" }, spots: ["desk"], deps: ["dev"], tools_allowed: ["read_file", "run_terminal"], tone: "analytical" },
      { ...BASE_AGENT, id: "designer", name: "Emma", role: "UI/UX Designer", emoji: "🎨", character: { ...DEFAULT_CHARACTER, outfit: "outfit_5", hair: "hair_25" }, spots: ["desk"], deps: ["pm"], tools_allowed: ["read_file", "write_file"], tone: "creative" },
      { ...BASE_AGENT, id: "researcher", name: "Alex", role: "Research", emoji: "🔬", character: { ...DEFAULT_CHARACTER, outfit: "outfit_6", hair: "hair_30" }, spots: ["desk", "chair"], deps: ["pm"], tools_allowed: ["read_file", "web_search"], tone: "curious", context_budget_tokens: 8192 },
    ] as Agent[],
  },
};

const STORAGE_KEY = "pixel-office-state-v1";

export default function App() {
  const [preset, setPreset] = useState<keyof typeof PRESETS | "__custom__" | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [officeLayout, setOfficeLayout] = useState<OfficeLayout | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch(LAYOUT_JSON_URL)
      .then((res) => res.json())
      .then((data) => {
        const layout =
          data.version != null && data.world?.bounds
            ? officeDesignJsonToOfficeLayout(data)
            : data;
        setOfficeLayout(cloneLayout(layout));
      })
      .catch((err) => {
        console.error("Failed to load Modern Office:", err);
      });
  }, []);

  // Initialize from localStorage (or default preset) once on mount
  useEffect(() => {
    if (initialized) return;
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.preset !== undefined) {
          setPreset(parsed.preset);
        }
        if (Array.isArray(parsed.agents)) {
          setAgents(parsed.agents);
        }
        if (typeof parsed.selectedId === "string" || parsed.selectedId === null) {
          setSelectedId(parsed.selectedId);
        }
        setInitialized(true);
        return;
      }
    } catch (e) {
      console.warn("Failed to load saved Pixel Office state", e);
    }
    // Fallback: default preset
    setPreset("virtual_it_agency");
    setAgents([...PRESETS.virtual_it_agency.agents]);
    setSelectedId(PRESETS.virtual_it_agency.agents[0]?.id ?? null);
    setInitialized(true);
  }, [initialized]);

  // Persist to localStorage whenever state changes after init
  useEffect(() => {
    if (!initialized) return;
    try {
      if (typeof window === "undefined") return;
      const payload = { preset, agents, selectedId };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save Pixel Office state", e);
    }
  }, [preset, agents, selectedId, initialized]);

  const applyPreset = (key: string) => {
    if (key === "__custom__") {
      setPreset(null);
      setAgents([DEFAULT_CEO]);
      setSelectedId("ceo");
    } else if (key in PRESETS) {
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
          define who reports to whom. Layout includes 9 desks, chairs, meeting and closet spots.
          Export a ready-to-deploy zip. No login. Runs in browser.
        </p>
      </header>

      {(preset || agents.length > 0) && (
        <>
          <section className="app-section">
            <AgentEditor
              presetPresets={Object.entries(PRESETS).map(([k, v]) => ({ id: k, name: v.name }))}
              presetSelected={preset ?? "__custom__"}
              onPresetSelect={applyPreset}
              agents={agents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={setAgents}
            />
          </section>

          <section className="app-section">
            <LayoutPreview layout={officeLayout} />
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
