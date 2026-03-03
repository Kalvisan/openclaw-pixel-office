import { useState } from "react";
import type { Agent } from "@openclaw-office/core";
import { CharacterAvatar } from "./CharacterAvatar";
import { CharacterEditor } from "./CharacterEditor";
import { IconTeam, IconLink, IconPlus, IconTrash, IconRefresh, IconClose } from "./Icons";
import { DEFAULT_CHARACTER } from "./characterAssets";
import type { RoleProfile } from "./roles";
import { BUILTIN_ROLES } from "./roles";
import { RoleModal } from "./RoleModal";

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
  onReset?: () => void;
  customRoles?: RoleProfile[];
  onCustomRolesChange?: (roles: RoleProfile[]) => void;
}

const CUSTOM_PRESET_ID = "__custom__";
const CREATE_ROLE_OPTION = "__create_role__";

export function AgentEditor({ agents, selectedId, onSelect, onChange, presetPresets, presetSelected, onPresetSelect, onReset, customRoles = [], onCustomRolesChange }: Props) {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalEdit, setRoleModalEdit] = useState<RoleProfile | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getRoleProfile = (roleId: string): RoleProfile | undefined =>
    BUILTIN_ROLES.find((r) => r.id === roleId) ?? customRoles.find((r) => r.id === roleId);

  const applyRoleToAgent = (idx: number, profile: RoleProfile) => {
    update(idx, {
      role: profile.name,
      roleId: profile.id,
      tone: profile.defaultTone,
      tools_allowed: [...(profile.defaultTools ?? [])],
    });
  };
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
      roleId: undefined,
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

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onPresetSelect?.(value === CUSTOM_PRESET_ID ? CUSTOM_PRESET_ID : value);
  };

  return (
    <div className="editor-layout">
      <div className="game-panel editor-panel" style={{ padding: 20 }}>
        <div className="team-header-row">
          <h2 className="game-font-title section-title" style={{ fontSize: 10, marginBottom: 0, color: "var(--game-gold)", display: "flex", alignItems: "center", gap: 6 }}>
            <IconTeam size={14} /> Team
          </h2>
          {presetPresets && presetPresets.length > 0 && onPresetSelect && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                className="preset-select"
                value={presetSelected ?? CUSTOM_PRESET_ID}
                onChange={handlePresetChange}
                aria-label="Team preset"
              >
                {presetPresets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value={CUSTOM_PRESET_ID}>Create your own</option>
              </select>
              {onReset && (
                <button
                  type="button"
                  className="btn-refresh"
                  onClick={() => setShowResetConfirm(true)}
                  title="Clear saved data and reset to default"
                  aria-label="Reset"
                >
                  <IconRefresh size={16} />
                </button>
              )}
            </div>
          )}
        </div>
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
      </div>

      {selected && selectedIdx >= 0 && (
        <div className="game-panel editor-detail" style={{ padding: 20 }}>
          <div className="editor-detail-header">
            <h3 className="editor-detail-title" style={{ fontSize: "1.1rem", color: "var(--game-gold)", margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {selected.name}
            </h3>
            <button
              type="button"
              className="btn-remove"
              onClick={() => {
                const next = agents.filter((a) => a.id !== selected.id);
                onChange(next);
                if (next.length === 0) {
                  onSelect("");
                } else if (!next.find((a) => a.id === selectedId)) {
                  onSelect(next[0].id);
                }
              }}
              title="Remove from team"
            >
              <IconTrash size={14} />
              <span>Remove</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 16 }}>
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
              <select
                className="preset-select form-select"
                value={selected.roleId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === CREATE_ROLE_OPTION) {
                    setRoleModalEdit(null);
                    setShowRoleModal(true);
                    return;
                  }
                  const profile = getRoleProfile(val);
                  if (profile) {
                    applyRoleToAgent(selectedIdx, profile);
                  } else {
                    update(selectedIdx, { role: val || selected.role, roleId: undefined });
                  }
                }}
              >
                <option value="">— Custom —</option>
                <optgroup label="Predefined">
                  {BUILTIN_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
                {customRoles.length > 0 && (
                  <optgroup label="Custom">
                    {customRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value={CREATE_ROLE_OPTION}>+ Create custom role...</option>
              </select>
              {selected.roleId?.startsWith("custom_") && getRoleProfile(selected.roleId) && (
                <button
                  type="button"
                  className="download-hint-link"
                  style={{ marginTop: 8, fontSize: "0.9rem" }}
                  onClick={() => {
                    setRoleModalEdit(getRoleProfile(selected.roleId!)!);
                    setShowRoleModal(true);
                  }}
                >
                  Edit custom role
                </button>
              )}
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

      {showRoleModal && (
        <RoleModal
          initialRole={roleModalEdit}
          customRoles={customRoles}
          onSave={(role) => {
            const exists = customRoles.some((r) => r.id === role.id);
            if (exists) {
              onCustomRolesChange?.(customRoles.map((r) => (r.id === role.id ? role : r)));
            } else {
              onCustomRolesChange?.([...customRoles, role]);
            }
            if (selected && selectedIdx >= 0) {
              applyRoleToAgent(selectedIdx, role);
            }
            setShowRoleModal(false);
            setRoleModalEdit(null);
          }}
          onClose={() => {
            setShowRoleModal(false);
            setRoleModalEdit(null);
          }}
        />
      )}

      {showResetConfirm && (
        <div
          className="download-modal-overlay"
          onClick={() => setShowResetConfirm(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          tabIndex={-1}
        >
          <div className="download-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="download-modal-header">
              <h2 id="reset-modal-title" className="game-font-title">Reset all data?</h2>
              <button
                type="button"
                className="download-modal-close"
                onClick={() => setShowResetConfirm(false)}
                aria-label="Close"
              >
                <IconClose size={20} />
              </button>
            </div>
            <div className="download-modal-body">
              <p className="download-modal-intro">
                This will clear all saved data from localStorage (team, custom roles) and reset to the default Virtual IT Agency preset. This cannot be undone.
              </p>
            </div>
            <div className="role-modal-footer">
              <button type="button" className="game-btn-secondary" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="game-btn"
                onClick={() => {
                  onReset?.();
                  setShowResetConfirm(false);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
