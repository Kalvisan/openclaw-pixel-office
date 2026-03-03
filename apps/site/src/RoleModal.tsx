/**
 * Modal for creating or editing a custom role.
 * Used when user selects "Create custom role" in the Role select.
 */

import { useState } from "react";
import { IconClose, IconPlus } from "./Icons";
import type { RoleProfile } from "./roles";

const TONE_OPTIONS = ["professional", "technical", "analytical", "creative", "curious", "friendly"];
const TOOL_OPTIONS = ["read_file", "write_file", "run_terminal", "web_search"];

const EMPTY_ROLE: RoleProfile = {
  id: "",
  name: "",
  summary: "",
  responsibilities: [""],
  workingStyle: "",
  defaultTone: "professional",
  defaultTools: [],
};

interface Props {
  initialRole?: RoleProfile | null;
  customRoles: RoleProfile[];
  onSave: (role: RoleProfile) => void;
  onClose: () => void;
}

function nextCustomId(customRoles: RoleProfile[]): string {
  const used = new Set(customRoles.map((r) => r.id));
  for (let i = 1; i < 1000; i++) {
    const id = `custom_${i}`;
    if (!used.has(id)) return id;
  }
  return `custom_${Date.now()}`;
}

export function RoleModal({ initialRole, customRoles, onSave, onClose }: Props) {
  const isEdit = Boolean(initialRole?.id && initialRole.id.startsWith("custom_"));
  const [form, setForm] = useState<RoleProfile>(
    initialRole ? { ...initialRole } : { ...EMPTY_ROLE, id: nextCustomId(customRoles) }
  );

  const update = (patch: Partial<RoleProfile>) => setForm((f) => ({ ...f, ...patch }));

  const updateResponsibility = (idx: number, value: string) => {
    setForm((f) => {
      const next = [...(f.responsibilities ?? [""])];
      next[idx] = value;
      return { ...f, responsibilities: next };
    });
  };

  const addResponsibility = () => {
    setForm((f) => ({
      ...f,
      responsibilities: [...(f.responsibilities ?? [""]), ""],
    }));
  };

  const removeResponsibility = (idx: number) => {
    setForm((f) => {
      const next = (f.responsibilities ?? [""]).filter((_, i) => i !== idx);
      return { ...f, responsibilities: next.length ? next : [""] };
    });
  };

  const toggleTool = (tool: string) => {
    setForm((f) => {
      const arr = f.defaultTools ?? [];
      const has = arr.includes(tool);
      return {
        ...f,
        defaultTools: has ? arr.filter((t) => t !== tool) : [...arr, tool],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const summary = form.summary.trim();
    const workingStyle = form.workingStyle.trim();
    const responsibilities = (form.responsibilities ?? [""])
      .map((r) => r.trim())
      .filter(Boolean);

    if (!name) return;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const id = form.id || (isEdit ? form.id : `custom_${slug}_${Date.now().toString(36)}`);

    onSave({
      ...form,
      id,
      name,
      summary: summary || `${name} - custom role.`,
      responsibilities: responsibilities.length ? responsibilities : ["Own your domain and deliver results."],
      workingStyle: workingStyle || "Follow pack defaults and adapt to context.",
    });
    onClose();
  };

  return (
    <div
      className="download-modal-overlay role-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      tabIndex={-1}
    >
      <div className="download-modal role-modal" onClick={(e) => e.stopPropagation()}>
        <div className="download-modal-header">
          <h2 id="role-modal-title" className="game-font-title">
            {isEdit ? "Edit custom role" : "Create custom role"}
          </h2>
          <button
            type="button"
            className="download-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="role-modal-form">
          <div className="download-modal-body">
            <div className="form-field">
              <label className="form-label">Role name</label>
              <input
                className="game-input"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Product Owner"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Summary</label>
              <textarea
                className="game-input role-textarea"
                value={form.summary}
                onChange={(e) => update({ summary: e.target.value })}
                placeholder="Brief description of what this role does (used in IDENTITY.md)"
                rows={2}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Responsibilities</label>
              <p className="section-hint" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
                One per line. Used in SOUL.md for the agent.
              </p>
              {(form.responsibilities ?? [""]).map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="game-input"
                    value={r}
                    onChange={(e) => updateResponsibility(i, e.target.value)}
                    placeholder={`Responsibility ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="game-btn-secondary"
                    style={{ padding: "8px 12px", minWidth: 44 }}
                    onClick={() => removeResponsibility(i)}
                    aria-label="Remove"
                    disabled={(form.responsibilities ?? []).length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="game-btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}
                onClick={addResponsibility}
              >
                <IconPlus size={14} /> Add responsibility
              </button>
            </div>

            <div className="form-field">
              <label className="form-label">Working style</label>
              <textarea
                className="game-input role-textarea"
                value={form.workingStyle}
                onChange={(e) => update({ workingStyle: e.target.value })}
                placeholder="How this role typically works (used in SOUL.md)"
                rows={2}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Default tone</label>
              <select
                className="preset-select"
                value={form.defaultTone}
                onChange={(e) => update({ defaultTone: e.target.value })}
                style={{ width: "100%", maxWidth: 240 }}
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Default tools</label>
              <p className="section-hint" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
                Tools this role can use by default.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TOOL_OPTIONS.map((tool) => {
                  const checked = (form.defaultTools ?? []).includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      className={`dep-chip-btn ${checked ? "checked" : ""}`}
                      onClick={() => toggleTool(tool)}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="role-modal-footer">
            <button type="button" className="game-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="game-btn">
              {isEdit ? "Save" : "Create role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
