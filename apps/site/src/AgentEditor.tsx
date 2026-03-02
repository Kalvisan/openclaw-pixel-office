import type { Agent } from "@openclaw-office/core";
import { CharacterAvatar } from "./CharacterAvatar";
import { CharacterEditor } from "./CharacterEditor";
import { PresetSelector } from "./PresetSelector";
import { IconTeam, IconLink, IconPlus } from "./Icons";
import { DEFAULT_CHARACTER } from "./characterAssets";

interface PresetItem {
  id: string;
  name: string;
}

interface Props {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (agents: Agent[]) => void;
  presetPresets?: PresetItem[];
  presetSelected?: string | null;
  onPresetSelect?: (id: string) => void;
}

export function AgentEditor({ agents, selectedId, onSelect, onChange, presetPresets, presetSelected, onPresetSelect }: Props) {
  const update = (idx: number, patch: Partial<Agent>) => {
    const next = [...agents];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const selected = agents.find((a) => a.id === selectedId);
  const selectedIdx = selected ? agents.findIndex((a) => a.id === selectedId) : -1;

  const toggleDep = (fromIdx: number, toId: string) => {
    const agent = agents[fromIdx];
    const deps = agent.deps ?? [];
    const has = deps.includes(toId);
    const newDeps = has ? deps.filter((d: string) => d !== toId) : [...deps, toId];
    update(fromIdx, { deps: newDeps });
  };

  const addMember = () => {
    const usedIds = new Set(agents.map((a) => a.id));
    let id = "agent_1";
    for (let i = 1; i < 1000; i++) {
      id = `agent_${i}`;
      if (!usedIds.has(id)) break;
    }
    const newAgent: Agent = {
      id,
      name: "New Member",
      role: "Role",
      daily_checklist: [],
      tools_allowed: [],
      tone: "professional",
      context_budget_tokens: 4096,
      escalation_rules: {},
      deps: [],
      character: { ...DEFAULT_CHARACTER },
      spots: ["desk", "chair", "closet"],
    };
    onChange([...agents, newAgent]);
    onSelect(id);
  };

  return (
    <div className="editor-layout">
      <div className="game-panel editor-panel" style={{ padding: 20 }}>
        <h2 className="game-font-title section-title" style={{ fontSize: 10, marginBottom: 8, color: "var(--game-gold)", display: "flex", alignItems: "center", gap: 6 }}>
          <IconTeam size={14} /> Team
        </h2>
        <p className="section-hint">Tap an agent to edit</p>
        <div className="team-grid">
          {agents.map((a) => {
            const depAgents = (a.deps ?? []).map((id: string) => agents.find((x) => x.id === id)).filter(Boolean) as Agent[];
            return (
            <button
              key={a.id}
              type="button"
              className={`team-card ${selectedId === a.id ? "selected" : ""}`}
              onClick={() => onSelect(a.id)}
            >
              <CharacterAvatar character={a.character} name={a.name} size={48} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: "1.1rem", color: "var(--game-text)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", fontWeight: 600 }}>
                  {a.name}
                </span>
                <span style={{ fontSize: "0.9rem", color: "var(--game-text-dim)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {a.role}
                </span>
                {depAgents.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }} title={`Reports to: ${depAgents.map((d: Agent) => d.name).join(", ")}`}>
                    {depAgents.map((d: Agent) => (
                      <CharacterAvatar key={d.id} character={d.character} name={d.name} size={24} />
                    ))}
                  </div>
                )}
              </div>
            </button>
            );
          })}
          <button type="button" className="team-card team-card-add" onClick={addMember} title="Add team member">
            <IconPlus size={32} />
            <span style={{ fontSize: "0.9rem", color: "var(--game-text-dim)" }}>Add member</span>
          </button>
        </div>
        {presetPresets && presetPresets.length > 0 && onPresetSelect && (
          <div className="preset-inline">
            <PresetSelector
              presets={presetPresets}
              selected={presetSelected ?? null}
              onSelect={onPresetSelect}
            />
          </div>
        )}
      </div>

      {selected && selectedIdx >= 0 && (
        <div className="game-panel editor-detail" style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="form-field">
              <label className="form-label">ID</label>
              <input
                className="game-input"
                value={selected.id}
                onChange={(e) => update(selectedIdx, { id: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                className="game-input"
                value={selected.name}
                onChange={(e) => update(selectedIdx, { name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Role</label>
              <input
                className="game-input"
                value={selected.role}
                onChange={(e) => update(selectedIdx, { role: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconLink size={12} /> Reports to
              </label>
              <p className="section-hint" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
                Tap team members this character depends on
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {agents
                  .filter((o) => o.id !== selected.id)
                  .map((o) => {
                    const checked = (selected.deps ?? []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`dep-chip-btn ${checked ? "checked" : ""}`}
                        onClick={() => toggleDep(selectedIdx, o.id)}
                      >
                        <CharacterAvatar character={o.character} name={o.name} size={36} />
                        <span style={{ fontSize: "0.8rem" }}>{o.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Character</label>
              <CharacterEditor
                character={selected.character ?? DEFAULT_CHARACTER}
                onChange={(character) => update(selectedIdx, { character })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
