/**
 * TOON format - allowed value types (deterministic subset)
 */
export type ToonPrimitive = string | number | boolean;
export type ToonValue =
  | ToonPrimitive
  | ToonValue[]
  | { [key: string]: ToonValue };

/**
 * Schema for validation - only these types allowed
 */
export type ToonSchemaType = "string" | "int" | "bool" | "list" | "map";

export interface ToonSchema {
  type: ToonSchemaType;
  items?: ToonSchema;
  properties?: Record<string, ToonSchema>;
  required?: string[];
}
