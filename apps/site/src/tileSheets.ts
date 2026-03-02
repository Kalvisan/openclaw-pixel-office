/**
 * Tile sheet configuration
 * - room: Room_Builder_Office_16x16.png (floors/walls)
 * - interior: Modern_Office_Black_Shadow.png (desks, chairs, decor)
 */

import { ASSETS } from "./assets";

export const TILE_SIZE = 16;

export type SheetId = "room" | "interior";

const SHEET_CONFIG = {
  room: {
    url: ASSETS.tiles.room,
    width: 256,
    height: 224,
    cols: 16,
    rows: 14,
    gap: 0,
  },
  interior: {
    url: ASSETS.tiles.interior,
    width: 256,
    height: 848,
    cols: 16,
    rows: 53,
    gap: 0,
  },
} as const;

/** Get sprite position in sheet (pixels from top-left) */
export function getSpriteXY(
  sheetId: SheetId,
  col: number,
  row: number
): { x: number; y: number } {
  const gap = SHEET_CONFIG[sheetId].gap ?? 0;
  const step = TILE_SIZE + gap;
  return { x: col * step, y: row * step };
}

export const SHEETS: Record<SheetId, { url: string; width: number; height: number }> = {
  room: {
    url: SHEET_CONFIG.room.url,
    width: SHEET_CONFIG.room.width,
    height: SHEET_CONFIG.room.height,
  },
  interior: {
    url: SHEET_CONFIG.interior.url,
    width: SHEET_CONFIG.interior.width,
    height: SHEET_CONFIG.interior.height,
  },
};

export function getSheetCols(sheetId: SheetId): number {
  return SHEET_CONFIG[sheetId].cols;
}

export function getSheetRows(sheetId: SheetId): number {
  return SHEET_CONFIG[sheetId].rows;
}
