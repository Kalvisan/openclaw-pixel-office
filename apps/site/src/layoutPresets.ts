/**
 * Office layout presets - room-builder system
 * Auto-generates empty floor + spots from agent count (desk, chair, closet, meeting)
 */

import type { OfficeLayout } from "@openclaw-office/zipgen";
import { getLayoutLayers } from "@openclaw-office/zipgen";
import { buildRoomLayout, layoutToFloorGrid } from "./room-builder-office-16x16";
import type { Agent } from "@openclaw-office/core";

const W = 40;
const H = 25;
const EMPTY = "";

const EMPTY_SPOTS: NonNullable<OfficeLayout["spots"]> = {
  desk: [],
  chair: [],
  meeting: [],
  closet: [],
};

// 2x2 Table (decor)
const TABLE_TL = "in_19_0";
const TABLE_TR = "in_19_1";
const TABLE_BL = "in_20_0";
const TABLE_BR = "in_20_1";

// 2x1 Sofa (chair)
const SOFA_L = "in_8_0";
const SOFA_R = "in_8_1";

function emptyObjectGrid(): string[][] {
  return Array(H).fill(null).map(() => Array(W).fill(EMPTY));
}

/** Room mask: 1 = inside, 0 = outside. Quadrilateral (trapezoid) – wider at bottom */
function quadrilateralRoomMask(w: number, h: number): number[][] {
  const topRow = 1;
  const bottomRow = h - 2;
  const topLeft = 8;
  const topRight = w - 9;
  const bottomLeft = 2;
  const bottomRight = w - 3;

  return Array(h)
    .fill(null)
    .map((_, y) =>
      Array(w)
        .fill(0)
        .map((_, x) => {
          if (y <= 0 || y >= h - 1) return 0;
          const t = (y - topRow) / (bottomRow - topRow);
          const left = Math.round(topLeft + (bottomLeft - topLeft) * t);
          const right = Math.round(topRight + (bottomRight - topRight) * t);
          return x >= left && x <= right ? 1 : 0;
        })
    );
}

function roomPreset(roomMask: number[][], furniture: string[][]): OfficeLayout {
  const layout = buildRoomLayout(roomMask, {
    floorMaterial: "grayTile",
    isWall: (v) => v === 0,
  });
  const floor = layoutToFloorGrid(layout, W, H);
  return {
    width: W,
    height: H,
    roomMask,
    floorMaterial: "grayTile",
    layers: [floor, furniture],
    spots: EMPTY_SPOTS,
  };
}

/** Normalize layout for export - convert roomMask to layers for TMX */
export function normalizeLayoutForExport(layout: OfficeLayout): OfficeLayout {
  if (!layout.roomMask || !layout.floorMaterial) {
    return layout;
  }
  const roomLayout = buildRoomLayout(layout.roomMask, {
    floorMaterial: layout.floorMaterial,
    isWall: (v) => v === 0,
  });
  const floor = layoutToFloorGrid(roomLayout, layout.width ?? W, layout.height ?? H);
  const objectLayers = layout.layers?.slice(1) ?? [emptyObjectGrid()];
  return {
    ...layout,
    width: layout.width ?? W,
    height: layout.height ?? H,
    layers: [floor, ...objectLayers],
    roomMask: undefined,
    floorMaterial: undefined,
  };
}

/** Clone layout for use as initial state (avoid mutating presets) */
export function cloneLayout(layout: OfficeLayout): OfficeLayout {
  const layers = getLayoutLayers(layout).map((l: string[][]) => l.map((r: string[]) => [...r]));
  const result: OfficeLayout = {
    width: layout.width ?? W,
    height: layout.height ?? H,
    layers,
    spots: layout.spots
      ? {
          desk: [...(layout.spots.desk ?? [])],
          chair: [...(layout.spots.chair ?? [])],
          meeting: [...(layout.spots.meeting ?? [])],
          closet: [...(layout.spots.closet ?? [])],
        }
      : EMPTY_SPOTS,
  };
  if (layout.roomMask) {
    result.roomMask = layout.roomMask.map((r: number[]) => [...r]);
  }
  if (layout.floorMaterial) {
    result.floorMaterial = layout.floorMaterial;
  }
  return result;
}

/** Check if (x,y) is inside room (floor) */
function inRoom(mask: number[][], x: number, y: number): boolean {
  return !!(mask[y]?.[x]);
}

/**
 * Auto-generate office layout: empty floor + spots based on agent count.
 * - desk: one per agent
 * - chair: one per agent (waiting)
 * - closet: 1 spot (skapja)
 * - meeting: 1 spot
 */
export function generateOfficeLayoutFromAgents(agents: Agent[]): OfficeLayout {
  const n = agents.length;
  const roomMask = quadrilateralRoomMask(W, H);
  const floor = layoutToFloorGrid(
    buildRoomLayout(roomMask, { floorMaterial: "grayTile", isWall: (v) => v === 0 }),
    W,
    H
  );
  const furniture = emptyObjectGrid();

  // Helper: keep only positions inside room
  const filterInRoom = (positions: { x: number; y: number }[]) =>
    positions.filter((p) => inRoom(roomMask, p.x, p.y));

  // Place desks in a grid (one per agent)
  const deskSpots: { x: number; y: number }[] = [];
  const startY = 6;
  const startX = 10;
  for (let i = 0; i < n; i++) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    deskSpots.push({ x: startX + col * 3, y: startY + row * 2 });
  }

  // Place waiting chairs (one per agent)
  const chairSpots: { x: number; y: number }[] = [];
  const chairStartY = 12;
  for (let i = 0; i < n; i++) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    chairSpots.push({ x: startX + col * 3, y: chairStartY + row * 2 });
  }

  // Closet spot (single) - bottom area
  const closetSpot = { x: 14, y: 20 };

  // Meeting spot (center)
  const meetingSpot = { x: 19, y: 16 };

  return {
    width: W,
    height: H,
    roomMask,
    floorMaterial: "grayTile",
    layers: [floor, furniture],
    spots: {
      desk: filterInRoom(deskSpots),
      chair: filterInRoom(chairSpots),
      meeting: filterInRoom([meetingSpot]),
      closet: filterInRoom([closetSpot]),
    },
  };
}

/** Empty room – quadrilateral floor */
function emptyPreset(): OfficeLayout {
  const roomMask = quadrilateralRoomMask(W, H);
  return roomPreset(roomMask, emptyObjectGrid());
}

/** Large room with tables and sofas – quadrilateral floor */
function largeRoomPreset(): OfficeLayout {
  const roomMask = quadrilateralRoomMask(W, H);
  const furniture = emptyObjectGrid();
  // Tables (2x2)
  furniture[6][10] = TABLE_TL;
  furniture[6][11] = TABLE_TR;
  furniture[7][10] = TABLE_BL;
  furniture[7][11] = TABLE_BR;
  furniture[6][26] = TABLE_TL;
  furniture[6][27] = TABLE_TR;
  furniture[7][26] = TABLE_BL;
  furniture[7][27] = TABLE_BR;
  furniture[14][10] = TABLE_TL;
  furniture[14][11] = TABLE_TR;
  furniture[15][10] = TABLE_BL;
  furniture[15][11] = TABLE_BR;
  furniture[14][26] = TABLE_TL;
  furniture[14][27] = TABLE_TR;
  furniture[15][26] = TABLE_BL;
  furniture[15][27] = TABLE_BR;
  // Sofas (2x1)
  furniture[10][6] = SOFA_L;
  furniture[10][7] = SOFA_R;
  furniture[10][32] = SOFA_L;
  furniture[10][33] = SOFA_R;
  furniture[18][6] = SOFA_L;
  furniture[18][7] = SOFA_R;
  furniture[18][32] = SOFA_L;
  furniture[18][33] = SOFA_R;
  return roomPreset(roomMask, furniture);
}

/** Main office layout – 9 desks (3×3 grid), chairs, meeting, closet. Used as default. */
export function mainOfficeLayout(): OfficeLayout {
  const roomMask = quadrilateralRoomMask(W, H);
  const floor = layoutToFloorGrid(
    buildRoomLayout(roomMask, { floorMaterial: "grayTile", isWall: (v) => v === 0 }),
    W,
    H
  );
  const furniture = emptyObjectGrid();

  // L-desk 2×2 tile IDs (in_0_0, in_0_1, in_1_0, in_1_1)
  const DESK_TL = "in_0_0";
  const DESK_TR = "in_0_1";
  const DESK_BL = "in_1_0";
  const DESK_BR = "in_1_1";

  // 9 desks in 3×3 grid (start 10,6, spacing 3)
  const deskPositions = [
    [10, 6], [13, 6], [16, 6],
    [10, 9], [13, 9], [16, 9],
    [10, 12], [13, 12], [16, 12],
  ];
  for (const [dx, dy] of deskPositions) {
    furniture[dy][dx] = DESK_TL;
    furniture[dy][dx + 1] = DESK_TR;
    furniture[dy + 1][dx] = DESK_BL;
    furniture[dy + 1][dx + 1] = DESK_BR;
  }

  // Sofas (2×1) – waiting area
  const SOFA_L = "in_8_0";
  const SOFA_R = "in_8_1";
  furniture[10][6] = SOFA_L;
  furniture[10][7] = SOFA_R;
  furniture[10][32] = SOFA_L;
  furniture[10][33] = SOFA_R;

  const filterInRoom = (positions: { x: number; y: number }[]) =>
    positions.filter((p) => inRoom(roomMask, p.x, p.y));

  // Desk spots (work position – front of each desk)
  const deskSpots = deskPositions.map(([x, y]) => ({ x: x + 1, y: y + 1 }));
  // Chair spots (waiting – near sofas)
  const chairSpots = [
    { x: 8, y: 10 }, { x: 9, y: 10 },
    { x: 33, y: 10 }, { x: 34, y: 10 },
  ];
  const closetSpot = { x: 14, y: 20 };
  const meetingSpot = { x: 19, y: 16 };

  return {
    width: W,
    height: H,
    roomMask,
    floorMaterial: "grayTile",
    layers: [floor, furniture],
    spots: {
      desk: filterInRoom(deskSpots),
      chair: filterInRoom(chairSpots),
      meeting: filterInRoom([meetingSpot]),
      closet: filterInRoom([closetSpot]),
    },
  };
}

export const LAYOUT_PRESETS: Record<string, { name: string; layout: OfficeLayout }> = {
  empty: { name: "Empty", layout: emptyPreset() },
  large_room: { name: "Large room (tables + sofas)", layout: largeRoomPreset() },
};
