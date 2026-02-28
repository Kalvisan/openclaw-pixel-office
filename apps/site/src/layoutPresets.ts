/**
 * Office layout presets - Modern Office Revamped style
 * Room_Builder (rb_*): walls rows 0-5, floors rows 6-12
 * Modern_Office (in_*): desk 0-14, sofa 15-27, locker 28-37, meeting 38-44
 */

import type { OfficeLayout } from "@openclaw-office/zipgen";

const W = 40;
const H = 25;
const EMPTY = "";

// Room_Builder tiles (Room_Builder_Office_16x16.png)
const WALL = "rb_0_0";
const FLOOR_MAIN = "rb_6_0";   // Light grey tiled floor (main office)
const FLOOR_ALT = "rb_7_0";    // Alternate floor (brick/wood - small office)

// Modern_Office tiles (Modern_Office_Shadowless_16x16.png)
const DESK = "in_0_0";
const SOFA = "in_21_0";
const MEETING = "in_38_0";
const LOCKER = "in_28_0";

function emptyGrid(): string[][] {
  return Array(H).fill(null).map(() => Array(W).fill(EMPTY));
}

function buildSpots(tiles: string[][]): NonNullable<OfficeLayout["spots"]> {
  const spots: NonNullable<OfficeLayout["spots"]> = { desk: [], sofa: [], meeting: [], locker: [] };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = tiles[y][x];
      if (t === DESK) spots.desk.push({ x, y });
      else if (t === SOFA) spots.sofa.push({ x, y });
      else if (t === MEETING) spots.meeting.push({ x, y });
      else if (t === LOCKER) spots.locker.push({ x, y });
    }
  }
  return spots;
}

/** Preset Office - Office_Design_2: L-shaped, cubicles + private office */
function presetOfficeGrid(): string[][] {
  const g = emptyGrid();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      g[y][x] = WALL;
    }
  }
  // Main office (top) - light grey floor
  for (let y = 1; y <= 14; y++) {
    for (let x = 1; x <= 38; x++) {
      g[y][x] = FLOOR_MAIN;
    }
  }
  // Small office (bottom-left) - alternate floor
  for (let y = 17; y <= 23; y++) {
    for (let x = 1; x <= 20; x++) {
      g[y][x] = FLOOR_ALT;
    }
  }
  // Corridor
  for (let x = 1; x <= 38; x++) {
    g[15][x] = FLOOR_MAIN;
    g[16][x] = FLOOR_MAIN;
  }

  // Main: 6 cubicles (2 rows x 3)
  const desks = [[6, 4], [16, 4], [26, 4], [6, 10], [16, 10], [26, 10]];
  for (const [x, y] of desks) g[y][x] = DESK;

  // Main: wall elements
  g[2][3] = LOCKER;
  g[2][19] = MEETING;
  g[2][35] = LOCKER;

  // Small office: L-desk, locker, manager desk
  g[19][4] = DESK;
  g[19][5] = DESK;
  g[20][4] = DESK;
  g[20][5] = DESK;
  g[19][8] = LOCKER;
  g[21][3] = LOCKER;
  g[20][14] = DESK;
  g[20][17] = MEETING;

  return g;
}

/** Small office - single room, 6 desks */
function smallOfficeGrid(): string[][] {
  const g = emptyGrid();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      g[y][x] = y === 0 || y === H - 1 || x === 0 || x === W - 1 ? WALL : FLOOR_MAIN;
    }
  }
  const desks = [[10, 8], [18, 8], [26, 8], [10, 16], [18, 16], [26, 16]];
  for (const [x, y] of desks) g[y][x] = DESK;
  return g;
}

/** Open space - grid of desks, meeting area, break zone */
function openSpaceGrid(): string[][] {
  const g = emptyGrid();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      g[y][x] = y === 0 || y === H - 1 || x === 0 || x === W - 1 ? WALL : FLOOR_MAIN;
    }
  }
  for (let dy = 6; dy <= 18; dy += 4) {
    for (let dx = 6; dx <= 32; dx += 6) g[dy][dx] = DESK;
  }
  g[10][34] = MEETING;
  g[10][35] = MEETING;
  g[11][34] = MEETING;
  g[11][35] = MEETING;
  g[18][6] = SOFA;
  g[18][7] = SOFA;
  return g;
}

export const LAYOUT_PRESETS: Record<string, { name: string; layout: OfficeLayout }> = {
  preset_office: {
    name: "Preset Office",
    layout: (() => {
      const g = presetOfficeGrid();
      return { width: W, height: H, tiles: g, spots: buildSpots(g) };
    })(),
  },
  empty: {
    name: "Empty (custom)",
    layout: {
      width: W,
      height: H,
      tiles: emptyGrid(),
      spots: { desk: [], sofa: [], meeting: [], locker: [] },
    },
  },
  small_office: {
    name: "Small office",
    layout: (() => {
      const g = smallOfficeGrid();
      return { width: W, height: H, tiles: g, spots: buildSpots(g) };
    })(),
  },
  open_space: {
    name: "Open space",
    layout: (() => {
      const g = openSpaceGrid();
      return { width: W, height: H, tiles: g, spots: buildSpots(g) };
    })(),
  },
};
