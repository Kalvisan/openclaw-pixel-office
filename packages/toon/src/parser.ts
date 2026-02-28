/**
 * TOON parser - deterministic parse from text to structured object
 * Format: key-value pairs, indentation for nesting, lists with - prefix
 */

export type ParseResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: string; line?: number };

export function parse<T = Record<string, unknown>>(input: string): ParseResult<T> {
  const lines = input.split("\n");
  const result: Record<string, unknown> = {};
  const stack: { obj: Record<string, unknown>; indent: number }[] = [
    { obj: result, indent: -1 },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const content = trimmed;

    // Pop stack until we find matching indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    // List item
    if (content.startsWith("- ")) {
      const listContent = content.slice(2).trim();
      const lastKey = Object.keys(current).pop();
      if (!lastKey || !Array.isArray(current[lastKey])) {
        return { ok: false, error: "List item without list context", line: i + 1 };
      }
      (current[lastKey] as unknown[]).push(parseValue(listContent));
      continue;
    }

    // Key: value
    const colonIdx = content.indexOf(":");
    if (colonIdx === -1) {
      return { ok: false, error: `Invalid line: missing ':'`, line: i + 1 };
    }

    const key = content.slice(0, colonIdx).trim();
    const valueStr = content.slice(colonIdx + 1).trim();

    if (valueStr === "" || valueStr === "[]" || valueStr === "{}") {
      // Start of nested structure
      if (valueStr === "[]") {
        current[key] = [];
      } else if (valueStr === "{}") {
        current[key] = {};
      } else {
        current[key] = {};
      }
      if (typeof current[key] === "object" && current[key] !== null && !Array.isArray(current[key])) {
        stack.push({ obj: current[key] as Record<string, unknown>, indent });
      }
    } else {
      current[key] = parseValue(valueStr);
    }
  }

  return { ok: true, value: result as T };
}

function parseValue(str: string): unknown {
  if (str === "true") return true;
  if (str === "false") return false;
  if (str === "null") return null;
  const num = Number(str);
  if (!Number.isNaN(num) && str.trim() !== "") return num;
  return str;
}
