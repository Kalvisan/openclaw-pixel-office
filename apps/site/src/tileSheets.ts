/**
 * Tile sheet configuration - single source of truth for sprite layout
 *
 * Sprite sheets from LimeZu Modern Office Revamped (16x16px tiles).
 * Format: tiles can have 0px or 1px gap between them.
 *
 * Verified dimensions (from actual PNG files):
 *   Room_Builder_Office_16x16.png: 256 x 224
 *   Modern_Office_Shadowless_16x16.png: 256 x 848
 */

import { ASSETS } from "./assets";

export const TILE_SIZE = 16;

export type SheetId = "room" | "interiors";

/** Gap between tiles in pixels (0 = packed, 1 = 1px margin) */
const SHEET_CONFIG: Record<
  SheetId,
  { url: string; width: number; height: number; cols: number; rows: number; gap: number }
> = {
  room: {
    url: ASSETS.tiles.room,
    width: 256,
    height: 224,
    cols: 15,
    rows: 13,
    gap: 1,
  },
  interiors: {
    url: ASSETS.tiles.interiors,
    width: 256,
    height: 848,
    cols: 15,
    rows: 49,
    gap: 1,
  },
};

const TILE_STEP = (sheetId: SheetId) =>
  TILE_SIZE + SHEET_CONFIG[sheetId].gap;

/** Get sprite position in sheet (pixels from top-left) */
export function getSpriteXY(
  sheetId: SheetId,
  col: number,
  row: number
): { x: number; y: number } {
  const step = TILE_STEP(sheetId);
  return { x: col * step, y: row * step };
}

export const SHEETS: Record<
  SheetId,
  { url: string; width: number; height: number }
> = {
  room: {
    url: SHEET_CONFIG.room.url,
    width: SHEET_CONFIG.room.width,
    height: SHEET_CONFIG.room.height,
  },
  interiors: {
    url: SHEET_CONFIG.interiors.url,
    width: SHEET_CONFIG.interiors.width,
    height: SHEET_CONFIG.interiors.height,
  },
};

export function getSheetCols(sheetId: SheetId): number {
  return SHEET_CONFIG[sheetId].cols;
}

export function getSheetRows(sheetId: SheetId): number {
  return SHEET_CONFIG[sheetId].rows;
}
