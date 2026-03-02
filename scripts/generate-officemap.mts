#!/usr/bin/env node
/**
 * Generate default officemap.tmx for office-viewer from minimal layout.
 * Uses tsx to import from zipgen (avoids Node ESM extension issues).
 */
import { officeLayoutToTMX } from "@openclaw-office/zipgen";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 40,
  H = 25;
const g = Array(H)
  .fill(null)
  .map(() => Array(W).fill(""));
const WALL = "rb_0_0";
const FLOOR = "rb_6_0";
const DESK = "in_0_0";

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    g[y][x] = y === 0 || y === H - 1 || x === 0 || x === W - 1 ? WALL : FLOOR;
  }
}
[
  [8, 10],
  [11, 10],
  [8, 13],
  [11, 13],
].forEach(([x, y]) => (g[y][x] = DESK));

const tmx = officeLayoutToTMX({ width: W, height: H, tiles: g });
const outDir = join(__dirname, "../apps/office-viewer/public/assets");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "officemap.tmx");
writeFileSync(outPath, tmx);
console.log("officemap.tmx written to", outPath);
