/**
 * TOON serializer - deterministic output for clean diffs
 * Keys are sorted alphabetically for consistency
 */

export function serialize(obj: unknown, indent = 0): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return escapeString(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const pad = "  ".repeat(indent);
    return obj
      .map((item) => `${pad}- ${serializeValue(item, indent)}`)
      .join("\n");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    entries.sort(([a], [b]) => a.localeCompare(b));

    const pad = "  ".repeat(indent);
    const lines: string[] = [];
    for (const [key, value] of entries) {
      const valStr = serializeValue(value, indent + 1);
      if (Array.isArray(value) && value.length > 0) {
        lines.push(`${pad}${key}:`);
        lines.push(serialize(value, indent + 1));
      } else if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        lines.push(`${pad}${key}:`);
        lines.push(serialize(value, indent + 1));
      } else {
        lines.push(`${pad}${key}: ${valStr}`);
      }
    }
    return lines.join("\n");
  }

  return String(obj);
}

function serializeValue(val: unknown, indent: number): string {
  if (typeof val === "string") return escapeString(val);
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val === null || val === undefined) return "null";
  if (Array.isArray(val)) return serialize(val, indent);
  if (typeof val === "object") return serialize(val, indent);
  return String(val);
}

function escapeString(s: string): string {
  if (/^[a-zA-Z0-9_-]+$/.test(s) && !s.includes(" ")) return s;
  return JSON.stringify(s);
}
