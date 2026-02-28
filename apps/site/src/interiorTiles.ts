/**
 * Interior tiles - Advanced (wall/floor) + Furniture (desk/sofa/locker/meeting)
 * Room_Builder: 15×13, 1px gap. Modern_Office: 15×49, 1px gap.
 */

import {
  SHEETS,
  getSpriteXY as getSpriteXYBase,
  type SheetId,
} from "./tileSheets";

export { SHEETS };

export const TILE_SIZE = 16;

export type SimType = "floor" | "wall" | "desk" | "sofa" | "locker" | "meeting";

export type { SheetId };

export interface TileDef {
  id: string;
  sheet: SheetId;
  col: number;
  row: number;
  simType: SimType;
  label: string;
}

/** Advanced: walls and floors - fewer options */
const ADVANCED_TILES: TileDef[] = [
  { id: "rb_0_0", sheet: "room", col: 0, row: 0, simType: "wall", label: "Wall" },
  { id: "rb_1_0", sheet: "room", col: 1, row: 0, simType: "wall", label: "Wall 2" },
  { id: "rb_2_0", sheet: "room", col: 2, row: 0, simType: "wall", label: "Wall 3" },
  { id: "rb_0_1", sheet: "room", col: 0, row: 1, simType: "wall", label: "Wall 4" },
  { id: "rb_6_0", sheet: "room", col: 0, row: 6, simType: "floor", label: "Floor" },
  { id: "rb_7_0", sheet: "room", col: 0, row: 7, simType: "floor", label: "Floor 2" },
  { id: "rb_8_0", sheet: "room", col: 0, row: 8, simType: "floor", label: "Floor 3" },
  { id: "rb_6_1", sheet: "room", col: 1, row: 6, simType: "floor", label: "Floor 4" },
];

/** Furniture: ~10 options per category. Includes preset tiles (in_21_0, in_28_0, in_38_0). */
const FURNITURE_TILES: TileDef[] = (() => {
  const tiles: TileDef[] = [];
  const add = (col: number, row: number, simType: SimType, label: string) => {
    tiles.push({ id: `in_${row}_${col}`, sheet: "interiors", col, row, simType, label });
  };
  // Desk: rows 0-1 (10 tiles)
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) add(c, r, "desk", `Desk ${r * 5 + c + 1}`);
  // Sofa: rows 15-16 + row 21 (preset)
  for (let r = 15; r < 17; r++) for (let c = 0; c < 5; c++) add(c, r, "sofa", `Sofa ${(r - 15) * 5 + c + 1}`);
  add(0, 21, "sofa", "Sofa (preset)");
  // Locker: rows 28-29 (includes in_28_0 for preset)
  for (let r = 28; r < 30; r++) for (let c = 0; c < 5; c++) add(c, r, "locker", `Locker ${(r - 28) * 5 + c + 1}`);
  // Meeting: rows 38-39 (includes in_38_0 for preset)
  for (let r = 38; r < 40; r++) for (let c = 0; c < 5; c++) add(c, r, "meeting", `Meeting ${(r - 38) * 5 + c + 1}`);
  return tiles;
})();

/** All tiles combined */
export const INTERIOR_TILES: TileDef[] = [...ADVANCED_TILES, ...FURNITURE_TILES];

/** Lookup by id */
export const TILES_BY_ID = new Map(INTERIOR_TILES.map((t) => [t.id, t]));

/** Grouped by category for UI - Advanced last (wall/floor) */
export const TILES_BY_CATEGORY = {
  desk: FURNITURE_TILES.filter((t) => t.simType === "desk"),
  sofa: FURNITURE_TILES.filter((t) => t.simType === "sofa"),
  locker: FURNITURE_TILES.filter((t) => t.simType === "locker"),
  meeting: FURNITURE_TILES.filter((t) => t.simType === "meeting"),
  advanced: ADVANCED_TILES,
} as const;

export function getSpriteXY(col: number, row: number, sheetId: SheetId) {
  return getSpriteXYBase(sheetId, col, row);
}

export const DEFAULT_FLOOR_ID = "rb_6_0";

export function getSimType(tileId: string): SimType | null {
  return TILES_BY_ID.get(tileId)?.simType ?? null;
}
