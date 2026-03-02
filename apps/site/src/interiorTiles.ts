/**
 * Interior tiles - from Modern_Office_Black_Shadow.png sprite sheet
 * Categories: Desks, Chairs/sofas, Decors
 *   desk: rows 0-6 (105), chair: 7-12 (90), decor: 13-22 (144)
 *
 * Floor/walls: room-builder system (room-builder-office-16x16.ts) - not tile picker
 */

import {
  SHEETS,
  getSpriteXY as getSpriteXYBase,
  type SheetId,
} from "./tileSheets";

export { SHEETS };

export const TILE_SIZE = 16;

export type SimType = "desk" | "chair" | "decor";

export type { SheetId };

export interface TileDef {
  id: string;
  sheet?: SheetId;
  col: number;
  row: number;
  simType: SimType;
  label: string;
}

/** Cell reference for multi-tile object - tileId + offset from anchor */
export interface ObjectCell {
  tileId: string;
  dx: number;
  dy: number;
}

/** Logical object - can be 1x1 or multi-tile. Used for placement. */
export interface ObjectDef {
  id: string;
  width: number;
  height: number;
  cells: ObjectCell[];
  simType: SimType;
  label: string;
  /** Tile ID for preview in sidebar (typically top-left cell) */
  previewTileId: string;
}

const INTERIOR_COLS = 15;
const INTERIOR_ROWS = 23; // rows 0-22, row 22 has 9 tiles (339 total)

/** Tile category by row (matches Modern_Office layout: desk 0-6, chair 7-12, decor 13-22) */
function getTileCategoryFromRowCol(row: number, _col: number): SimType {
  if (row <= 6) return "desk";
  if (row <= 12) return "chair";
  return "decor";
}

/** Generate interior tiles from sprite sheet (in_0_0 to in_22_8, 339 tiles) */
function buildInteriorTiles(): TileDef[] {
  const tiles: TileDef[] = [];
  for (let r = 0; r < INTERIOR_ROWS; r++) {
    const colsInRow = r < 22 ? INTERIOR_COLS : 9;
    for (let c = 0; c < colsInRow; c++) {
      const simType = getTileCategoryFromRowCol(r, c);
      const index = r * INTERIOR_COLS + c + 1;
      tiles.push({
        id: `in_${r}_${c}`,
        sheet: "interior",
        col: c,
        row: r,
        simType,
        label: `${simType.charAt(0).toUpperCase() + simType.slice(1)} ${index}`,
      });
    }
  }
  return tiles;
}

/** All individual tiles (interior only - floor/walls use room-builder) */
const INTERIOR_TILES = buildInteriorTiles();
export const ALL_TILES: TileDef[] = [...INTERIOR_TILES];

/** Lookup by id */
export const TILES_BY_ID = new Map(ALL_TILES.map((t) => [t.id, t]));

/** Multi-tile objects - tiles from interior sheet (in_0_0 to in_22_8) */
const MULTI_TILE_OBJECTS: ObjectDef[] = [
  // 2x2 Tables (decor: rows 19-22)
  {
    id: "obj_table_2x2_a",
    width: 2,
    height: 2,
    cells: [
      { tileId: "in_19_0", dx: 0, dy: 0 },
      { tileId: "in_19_1", dx: 1, dy: 0 },
      { tileId: "in_20_0", dx: 0, dy: 1 },
      { tileId: "in_20_1", dx: 1, dy: 1 },
    ],
    simType: "decor",
    label: "Table 2×2 A",
    previewTileId: "in_19_0",
  },
  {
    id: "obj_table_2x2_b",
    width: 2,
    height: 2,
    cells: [
      { tileId: "in_19_2", dx: 0, dy: 0 },
      { tileId: "in_19_3", dx: 1, dy: 0 },
      { tileId: "in_20_2", dx: 0, dy: 1 },
      { tileId: "in_20_3", dx: 1, dy: 1 },
    ],
    simType: "decor",
    label: "Table 2×2 B",
    previewTileId: "in_19_2",
  },
  {
    id: "obj_table_2x2_c",
    width: 2,
    height: 2,
    cells: [
      { tileId: "in_21_0", dx: 0, dy: 0 },
      { tileId: "in_21_1", dx: 1, dy: 0 },
      { tileId: "in_22_0", dx: 0, dy: 1 },
      { tileId: "in_22_1", dx: 1, dy: 1 },
    ],
    simType: "decor",
    label: "Table 2×2 C",
    previewTileId: "in_21_0",
  },
  // 2x1 Sofas (chair: rows 7-12)
  {
    id: "obj_sofa_2x1_a",
    width: 2,
    height: 1,
    cells: [
      { tileId: "in_7_0", dx: 0, dy: 0 },
      { tileId: "in_7_1", dx: 1, dy: 0 },
    ],
    simType: "chair",
    label: "Sofa 2×1 A",
    previewTileId: "in_7_0",
  },
  {
    id: "obj_sofa_2x1_b",
    width: 2,
    height: 1,
    cells: [
      { tileId: "in_7_2", dx: 0, dy: 0 },
      { tileId: "in_7_3", dx: 1, dy: 0 },
    ],
    simType: "chair",
    label: "Sofa 2×1 B",
    previewTileId: "in_7_2",
  },
  {
    id: "obj_sofa_2x1_preset",
    width: 2,
    height: 1,
    cells: [
      { tileId: "in_8_0", dx: 0, dy: 0 },
      { tileId: "in_8_1", dx: 1, dy: 0 },
    ],
    simType: "chair",
    label: "Sofa 2×1 (preset)",
    previewTileId: "in_8_0",
  },
  // 2x2 L-shaped desk (desk: rows 0-6)
  {
    id: "obj_desk_L_2x2",
    width: 2,
    height: 2,
    cells: [
      { tileId: "in_0_0", dx: 0, dy: 0 },
      { tileId: "in_0_1", dx: 1, dy: 0 },
      { tileId: "in_1_0", dx: 0, dy: 1 },
      { tileId: "in_1_1", dx: 1, dy: 1 },
    ],
    simType: "desk",
    label: "L-desk 2×2",
    previewTileId: "in_0_0",
  },
];

/** Single-tile objects - one TileDef = one ObjectDef */
function singleTileToObject(tile: TileDef): ObjectDef {
  return {
    id: `obj_${tile.id}`,
    width: 1,
    height: 1,
    cells: [{ tileId: tile.id, dx: 0, dy: 0 }],
    simType: tile.simType,
    label: tile.label,
    previewTileId: tile.id,
  };
}

/** Curated single-tile objects - representative subset per category */
const SINGLE_TILE_OBJECTS: ObjectDef[] = (() => {
  const tileIds: string[] = [
    ...Array.from({ length: 15 }, (_, i) => `in_0_${i}`),
    ...Array.from({ length: 15 }, (_, i) => `in_7_${i}`),
    ...Array.from({ length: 15 }, (_, i) => `in_13_${i}`),
  ];
  return tileIds
    .filter((id) => TILES_BY_ID.has(id))
    .map((id) => singleTileToObject(TILES_BY_ID.get(id)!));
})();

/** All objects - multi-tile first, then single-tile */
export const ALL_OBJECTS: ObjectDef[] = [...MULTI_TILE_OBJECTS, ...SINGLE_TILE_OBJECTS];
export const OBJECTS_BY_ID = new Map(ALL_OBJECTS.map((o) => [o.id, o]));

/** Grouped by category for UI: Decors, Desks, Chairs/sofas */
export const OBJECTS_BY_CATEGORY = {
  decor: ALL_OBJECTS.filter((o) => o.simType === "decor"),
  desk: ALL_OBJECTS.filter((o) => o.simType === "desk"),
  chair: ALL_OBJECTS.filter((o) => o.simType === "chair"),
} as const;

/** Legacy: TILES_BY_CATEGORY for backward compat */
export const TILES_BY_CATEGORY = OBJECTS_BY_CATEGORY;

export function getSpriteXY(col: number, row: number, sheetId: SheetId) {
  return getSpriteXYBase(sheetId, col, row);
}

export function getSimType(tileId: string): SimType | null {
  return TILES_BY_ID.get(tileId)?.simType ?? null;
}

/** Get object cells for placement */
export function getObjectCells(objectId: string): ObjectCell[] | null {
  return OBJECTS_BY_ID.get(objectId)?.cells ?? null;
}
