/**
 * TOON schema validator - validates parsed objects against schema
 */

import type { ToonSchema } from "./types.js";

export type ValidationResult =
  | { valid: true }
  | { valid: false; path: string; message: string };

export function validate(
  value: unknown,
  schema: ToonSchema,
  path = ""
): ValidationResult {
  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        return { valid: false, path, message: `Expected string, got ${typeof value}` };
      }
      return { valid: true };

    case "int":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return { valid: false, path, message: `Expected integer, got ${typeof value}` };
      }
      return { valid: true };

    case "bool":
      if (typeof value !== "boolean") {
        return { valid: false, path, message: `Expected boolean, got ${typeof value}` };
      }
      return { valid: true };

    case "list":
      if (!Array.isArray(value)) {
        return { valid: false, path, message: `Expected array, got ${typeof value}` };
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const r = validate(value[i], schema.items, `${path}[${i}]`);
          if (!r.valid) return r;
        }
      }
      return { valid: true };

    case "map":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { valid: false, path, message: `Expected object, got ${typeof value}` };
      }
      if (schema.required) {
        for (const req of schema.required) {
          if (!(req in (value as Record<string, unknown>))) {
            return { valid: false, path: `${path}.${req}`, message: `Missing required field: ${req}` };
          }
        }
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const v = (value as Record<string, unknown>)[key];
          if (v !== undefined) {
            const r = validate(v, propSchema, `${path}.${key}`);
            if (!r.valid) return r;
          }
        }
      }
      return { valid: true };

    default:
      return { valid: false, path, message: `Unknown schema type: ${(schema as ToonSchema).type}` };
  }
}
