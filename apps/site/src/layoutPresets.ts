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
  if (layout.collision?.blocked?.length) {
    result.collision = { blocked: layout.collision.blocked.map((b) => ({ ...b })) };
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

/** Only Modern Office preset (loaded from office-layout-converted.json). Other presets removed. */
export const LAYOUT_PRESETS: Record<string, { name: string; layout: OfficeLayout }> = {};
