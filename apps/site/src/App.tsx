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
import { BUILTIN_ROLES } from "./roles";
import type { RoleProfile } from "./roles";

const BASE_AGENT = {
  daily_checklist: [] as string[],
  escalation_rules: {} as Record<string, unknown>,
};

/** Build agent from preset slot + role profile. Role data (role, tone, tools_allowed) comes from BUILTIN_ROLES. */
function buildPresetAgent(
  slot: { id: string; name: string; roleId: string; emoji: string; character: typeof DEFAULT_CHARACTER; spots: string[]; deps: string[]; context_budget_tokens?: number }
): Agent {
  const profile = BUILTIN_ROLES.find((r) => r.id === slot.roleId);
  return {
    ...BASE_AGENT,
    id: slot.id,
    name: slot.name,
    role: profile?.name ?? slot.roleId,
    roleId: slot.roleId,
    tone: profile?.defaultTone ?? "professional",
    tools_allowed: profile ? [...profile.defaultTools] : [],
    context_budget_tokens: slot.context_budget_tokens ?? 4096,
    emoji: slot.emoji,
    character: slot.character,
    spots: slot.spots,
    deps: slot.deps,
  };
}

/** Default CEO when user creates their own team */
const DEFAULT_CEO: Agent = buildPresetAgent({
  id: "ceo",
  name: "You",
  roleId: "ceo",
  emoji: "👔",
  character: { ...DEFAULT_CHARACTER, outfit: "outfit_1", hair: "hair_5" },
  spots: ["desk", "meeting"],
  deps: [],
});

const VIRTUAL_IT_AGENCY_SLOTS = [
  { id: "ceo", name: "James", roleId: "ceo", emoji: "👔", character: { ...DEFAULT_CHARACTER, outfit: "outfit_1", hair: "hair_5" }, spots: ["desk", "meeting"], deps: [] },
  { id: "pm", name: "Sarah", roleId: "pm", emoji: "📋", character: { ...DEFAULT_CHARACTER, outfit: "outfit_2", hair: "hair_10" }, spots: ["desk", "meeting"], deps: ["ceo"] },
  { id: "dev", name: "Mike", roleId: "dev", emoji: "💻", character: { ...DEFAULT_CHARACTER, outfit: "outfit_3", hair: "hair_15" }, spots: ["desk"], deps: ["pm"], context_budget_tokens: 8192 },
  { id: "qa", name: "Lisa", roleId: "qa", emoji: "🔍", character: { ...DEFAULT_CHARACTER, outfit: "outfit_4", hair: "hair_20" }, spots: ["desk"], deps: ["dev"] },
  { id: "designer", name: "Emma", roleId: "designer", emoji: "🎨", character: { ...DEFAULT_CHARACTER, outfit: "outfit_5", hair: "hair_25" }, spots: ["desk"], deps: ["pm"] },
  { id: "researcher", name: "Alex", roleId: "researcher", emoji: "🔬", character: { ...DEFAULT_CHARACTER, outfit: "outfit_6", hair: "hair_30" }, spots: ["desk", "chair"], deps: ["pm"], context_budget_tokens: 8192 },
];

const PRESETS = {
  virtual_it_agency: {
    name: "Virtual IT Agency",
    agents: VIRTUAL_IT_AGENCY_SLOTS.map((s) => buildPresetAgent(s)),
  },
};

const STORAGE_KEY = "pixel-office-state-v1";
const STORAGE_KEY_ROLES = "pixel-office-custom-roles-v1";

export default function App() {
  const [preset, setPreset] = useState<keyof typeof PRESETS | "__custom__" | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customRoles, setCustomRoles] = useState<RoleProfile[]>([]);
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
      const rolesRaw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY_ROLES) : null;
      if (rolesRaw) {
        try {
          const parsed = JSON.parse(rolesRaw);
          if (Array.isArray(parsed)) setCustomRoles(parsed);
        } catch {
          // ignore
        }
      }
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

  useEffect(() => {
    if (!initialized || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(customRoles));
    } catch (e) {
      console.warn("Failed to save custom roles", e);
    }
  }, [customRoles, initialized]);

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

  const handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(STORAGE_KEY_ROLES);
      }
    } catch (e) {
      console.warn("Failed to clear localStorage", e);
    }
    setPreset("virtual_it_agency");
    setAgents([...PRESETS.virtual_it_agency.agents]);
    setSelectedId(PRESETS.virtual_it_agency.agents[0]?.id ?? null);
    setCustomRoles([]);
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
              onReset={handleReset}
              agents={agents}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={setAgents}
              customRoles={customRoles}
              onCustomRolesChange={setCustomRoles}
            />
          </section>

          <section className="app-section">
            <LayoutPreview layout={officeLayout} />
          </section>
          <section className="app-section">
            <DownloadZip agents={agents} customRoles={customRoles} officeLayout={officeLayout} />
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
