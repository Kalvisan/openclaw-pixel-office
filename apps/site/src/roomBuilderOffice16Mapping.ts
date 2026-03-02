/**
 * Room_Builder_Office_16x16.png – mapping spec
 *
 * Reference: Modern_Office_Revamped Office_Design_1.aseprite, Office_Design_2.aseprite
 * Same logic as Aseprite designs: floor shadows at top/left only, walls in 2 layers.
 *
 * Tile ID formula: tileId = row * 16 + col
 * Grid: 16 cols x 14 rows
 *
 * Walls: 2 layers – wallFace (body) + wallTop (cap)
 * Floor: shadows only at top/left edges
 */

export const TILE_SIZE = 16;
export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 14;

export function tileIdToRowCol(tileId: number) {
  return {
    row: Math.floor(tileId / 16),
    col: tileId % 16,
  };
}

export function tileIdToRect(tileId: number) {
  const { row, col } = tileIdToRowCol(tileId);
  return {
    sx: col * TILE_SIZE,
    sy: row * TILE_SIZE,
    sw: TILE_SIZE,
    sh: TILE_SIZE,
  };
}

/** rb_row_col string for zipgen compatibility */
export function tileIdToRbString(tileId: number): string {
  const { row, col } = tileIdToRowCol(tileId);
  return `rb_${row}_${col}`;
}

export const CEILING = {
  main: [23, 24, 25, 39, 41, 55, 56, 57],
  tJunction: [49, 50],
  turn: [21, 22],
} as const;

/** Floor – 6 variants, shadows only at top/left */
export type FloorVariant = {
  base: number;
  fullShadow: number;
  leftShadow: number;
  topShadow: number;
  topLeftShadow: number;
  softTopLeftShadow: number;
};

function makeFloorVariant(base: number): FloorVariant {
  return {
    base,
    fullShadow: base + 1,
    leftShadow: base - 1,
    topShadow: base - 16,
    topLeftShadow: base - 15,
    softTopLeftShadow: base - 14,
  };
}

export const FLOORS = {
  gray_carpet: makeFloorVariant(107),
  wood_floor: makeFloorVariant(110),
  gray_checkered_carpet: makeFloorVariant(139),
  brown_checkered_carpet: makeFloorVariant(142),
  dark_pattern_carpet: makeFloorVariant(171),
  brown_pattern_carpet: makeFloorVariant(174),
  red_checkered_carpet: makeFloorVariant(203),
  red_pattern_carpet: makeFloorVariant(206),
} as const;

export type FloorName = keyof typeof FLOORS;
export type FloorState =
  | "base"
  | "fullShadow"
  | "leftShadow"
  | "topShadow"
  | "topLeftShadow"
  | "softTopLeftShadow";

export function getFloorState(
  hasWallUp: boolean,
  hasWallLeft: boolean,
  useSoftCorner = false,
  useFullShadow = false
): FloorState {
  if (useFullShadow) return "fullShadow";
  if (hasWallUp && hasWallLeft) {
    return useSoftCorner ? "softTopLeftShadow" : "topLeftShadow";
  }
  if (hasWallUp) return "topShadow";
  if (hasWallLeft) return "leftShadow";
  return "base";
}

export function getFloorTileId(floorName: FloorName, state: FloorState): number {
  return FLOORS[floorName][state];
}

/** Wall – 6 variants, body + cap */
export type WallVariant = {
  base: number;
  top: number;
  rightEnd: number;
  topRightEnd: number;
  leftEnd: number;
  topLeftEnd: number;
};

function makeWallVariant(base: number): WallVariant {
  return {
    base,
    top: base - 16,
    rightEnd: base + 1,
    topRightEnd: base - 15,
    leftEnd: base - 1,
    topLeftEnd: base - 17,
  };
}

export const WALLS = {
  violet_stone: makeWallVariant(97),
  gray_stone: makeWallVariant(129),
  brown_brick: makeWallVariant(161),
  white_wallpaper: makeWallVariant(193),
} as const;

export type WallName = keyof typeof WALLS;
export type WallState =
  | "base"
  | "top"
  | "leftEnd"
  | "rightEnd"
  | "topLeftEnd"
  | "topRightEnd";

export function getWallState(
  hasWallAbove: boolean,
  hasWallLeft: boolean,
  hasWallRight: boolean
): WallState {
  if (!hasWallAbove && !hasWallLeft) return "topLeftEnd";
  if (!hasWallAbove && !hasWallRight) return "topRightEnd";
  if (!hasWallAbove) return "top";
  if (!hasWallLeft) return "leftEnd";
  if (!hasWallRight) return "rightEnd";
  return "base";
}

export function getWallTileId(wallName: WallName, state: WallState): number {
  return WALLS[wallName][state];
}

/** Wall face uses body only: base, leftEnd, rightEnd */
export function getWallFaceState(
  _hasWallAbove: boolean,
  hasWallLeft: boolean,
  hasWallRight: boolean
): WallState {
  if (!hasWallLeft) return "leftEnd";
  if (!hasWallRight) return "rightEnd";
  return "base";
}

/** Wall top uses cap states – only when top edge is visible (!hasWallAbove) */
export function getWallTopState(
  hasWallLeft: boolean,
  hasWallRight: boolean
): WallState {
  if (!hasWallLeft) return "topLeftEnd";
  if (!hasWallRight) return "topRightEnd";
  return "top";
}

export function getCeilingTileId(
  kind: "main" | "tJunction" | "turn",
  index = 0
): number {
  const arr = CEILING[kind];
  return arr[index % arr.length];
}
