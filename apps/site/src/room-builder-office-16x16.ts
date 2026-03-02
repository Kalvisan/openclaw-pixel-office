/**
 * Room_Builder_Office_16x16.png – room generation
 *
 * Logic aligned with Office_Design_1/2.aseprite (Modern_Office_Revamped).
 * Walls: 2 layers – wallFace (body) + wallTop (cap)
 * Floor: shadows only at top/left edges (hasWallUp, hasWallLeft)
 * roomMask: 1 = inside, 0 = wall/outside
 */

import {
  TILE_SIZE,
  ATLAS_COLS,
  ATLAS_ROWS,
  tileIdToRowCol,
  tileIdToRbString,
  getFloorState,
  getFloorTileId as getFloorTileIdByState,
  getWallFaceState,
  getWallTopState,
  getWallTileId,
  type FloorName,
  type WallName,
} from "./roomBuilderOffice16Mapping";

export { TILE_SIZE, ATLAS_COLS, ATLAS_ROWS };

export type TileCoord = [row: number, col: number];

export function tileId(row: number, col: number): string {
  return `rb_${row}_${col}`;
}

export function tileRect(row: number, col: number) {
  return {
    sx: col * TILE_SIZE,
    sy: row * TILE_SIZE,
    sw: TILE_SIZE,
    sh: TILE_SIZE,
  };
}

/** FloorMaterialName – compatible with zipgen */
export type FloorMaterialName = "purpleStone" | "grayTile" | "brownBrick" | "paleLilac";

const FLOOR_MATERIAL_TO_FLOOR_NAME: Record<FloorMaterialName, FloorName> = {
  grayTile: "gray_checkered_carpet",
  purpleStone: "gray_carpet",
  brownBrick: "brown_checkered_carpet",
  paleLilac: "red_pattern_carpet",
};

/** UI dropdown */
export const FLOOR_MATERIALS: Record<FloorMaterialName, { name: string }> = {
  grayTile: { name: "Gray tile" },
  purpleStone: { name: "Purple stone" },
  brownBrick: { name: "Brown brick" },
  paleLilac: { name: "Pale lilac" },
};

function inRoom(mask: number[][], x: number, y: number): boolean {
  return !!mask[y]?.[x];
}

export type LayerName = "floor" | "wallFace" | "wallTop";

export interface DrawCommand {
  layer: LayerName;
  tile: string;
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface BuildRoomOptions {
  floorMaterial?: FloorMaterialName;
  wallMaterial?: WallName;
  isWall?: (v: number) => boolean;
}

export function buildRoomLayout(
  roomMask: number[][],
  options: BuildRoomOptions = {}
) {
  const {
    floorMaterial = "grayTile",
    wallMaterial = "gray_stone",
    isWall = (v: number) => v === 0,
  } = options;

  const floorName = FLOOR_MATERIAL_TO_FLOOR_NAME[floorMaterial];
  const result = {
    floor: [] as DrawCommand[],
    wallFace: [] as DrawCommand[],
    wallTop: [] as DrawCommand[],
  };

  const h = roomMask.length;
  const w = roomMask[0]?.length ?? 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inRoom(roomMask, x, y)) {
        const hasWallUp = !inRoom(roomMask, x, y - 1);
        const hasWallLeft = !inRoom(roomMask, x - 1, y);
        const state = getFloorState(hasWallUp, hasWallLeft, false, false);
        const tileIdNum = getFloorTileIdByState(floorName, state);
        const { row, col } = tileIdToRowCol(tileIdNum);
        result.floor.push({
          layer: "floor",
          tile: tileIdToRbString(tileIdNum),
          row,
          col,
          x,
          y,
        });
      } else if (isWall(roomMask[y]?.[x] ?? 1)) {
        const hasWallAbove = y > 0 && !inRoom(roomMask, x, y - 1);
        const hasWallLeft = x > 0 && !inRoom(roomMask, x - 1, y);
        const hasWallRight = x < w - 1 && !inRoom(roomMask, x + 1, y);

        const faceState = getWallFaceState(hasWallAbove, hasWallLeft, hasWallRight);
        const faceTileId = getWallTileId(wallMaterial, faceState);
        const faceRC = tileIdToRowCol(faceTileId);
        result.wallFace.push({
          layer: "wallFace",
          tile: tileIdToRbString(faceTileId),
          row: faceRC.row,
          col: faceRC.col,
          x,
          y,
        });

        if (!hasWallAbove) {
          const topState = getWallTopState(hasWallLeft, hasWallRight);
          const topTileId = getWallTileId(wallMaterial, topState);
          const topRC = tileIdToRowCol(topTileId);
          result.wallTop.push({
            layer: "wallTop",
            tile: tileIdToRbString(topTileId),
            row: topRC.row,
            col: topRC.col,
            x,
            y,
          });
        }
      }
    }
  }

  return result;
}

/** Minimal placeholder – no tiles, just colored rects. Use for functional dev. */
const USE_EMPTY_MAP = true;

const PLACEHOLDER_COLORS = {
  floor: "#2a2a35",
  wallFace: "#1e1e28",
  wallTop: "#252530",
} as const;

export function drawLayout(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  layout: ReturnType<typeof buildRoomLayout>,
  offsetX = 0,
  offsetY = 0
) {
  if (USE_EMPTY_MAP || !image) {
    const draw = (items: DrawCommand[], color: string) => {
      ctx.fillStyle = color;
      for (const item of items) {
        ctx.fillRect(
          offsetX + item.x * TILE_SIZE,
          offsetY + item.y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    };
    draw(layout.floor, PLACEHOLDER_COLORS.floor);
    draw(layout.wallFace, PLACEHOLDER_COLORS.wallFace);
    draw(layout.wallTop, PLACEHOLDER_COLORS.wallTop);
    return;
  }
  const draw = (items: DrawCommand[]) => {
    for (const item of items) {
      const rect = tileRect(item.row, item.col);
      ctx.drawImage(
        image,
        rect.sx,
        rect.sy,
        rect.sw,
        rect.sh,
        offsetX + item.x * TILE_SIZE,
        offsetY + item.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  };
  draw(layout.floor);
  draw(layout.wallFace);
  draw(layout.wallTop);
}

export function stringGridToRoomMask(
  grid: string[][],
  isWall: (tileId: string) => boolean = (id) =>
    !!id?.startsWith("rb_") &&
    !id.startsWith("rb_6_") &&
    !id.startsWith("rb_7_") &&
    !id.startsWith("rb_8_") &&
    !id.startsWith("rb_9_") &&
    !id.startsWith("rb_10_") &&
    !id.startsWith("rb_11_") &&
    !id.startsWith("rb_12_")
): number[][] {
  return grid.map((row) =>
    row.map((cell) => (cell && !isWall(cell) ? 1 : 0))
  );
}

/** Single grid for export – floor + wallFace + wallTop (last overwrites) */
export function layoutToFloorGrid(
  layout: ReturnType<typeof buildRoomLayout>,
  width: number,
  height: number
): string[][] {
  const grid = Array(height)
    .fill(null)
    .map(() => Array(width).fill(""));
  for (const cmd of layout.floor) {
    if (cmd.y >= 0 && cmd.y < height && cmd.x >= 0 && cmd.x < width) {
      grid[cmd.y][cmd.x] = cmd.tile;
    }
  }
  for (const cmd of layout.wallFace) {
    if (cmd.y >= 0 && cmd.y < height && cmd.x >= 0 && cmd.x < width) {
      grid[cmd.y][cmd.x] = cmd.tile;
    }
  }
  for (const cmd of layout.wallTop) {
    if (cmd.y >= 0 && cmd.y < height && cmd.x >= 0 && cmd.x < width) {
      grid[cmd.y][cmd.x] = cmd.tile;
    }
  }
  return grid;
}

export function getFloorTileCoord(
  material: FloorMaterialName,
  roomMask: number[][],
  x: number,
  y: number,
  _useAlt = false
): TileCoord {
  const floorName = FLOOR_MATERIAL_TO_FLOOR_NAME[material];
  const hasWallUp = !inRoom(roomMask, x, y - 1);
  const hasWallLeft = !inRoom(roomMask, x - 1, y);
  const state = getFloorState(hasWallUp, hasWallLeft, false, false);
  const tileIdNum = getFloorTileIdByState(floorName, state);
  const { row, col } = tileIdToRowCol(tileIdNum);
  return [row, col];
}

export function getFloorTileId(
  material: FloorMaterialName,
  roomMask: number[][],
  x: number,
  y: number,
  useAlt = false
): string {
  const coord = getFloorTileCoord(material, roomMask, x, y, useAlt);
  return tileId(coord[0], coord[1]);
}
