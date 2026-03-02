#!/usr/bin/env node
/**
 * Setup office-viewer assets: copy tiles, write TSX, run stitch + generate-officemap.
 * Run before pnpm dev:office-viewer if assets are missing.
 */
import { copyFileSync, mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "../apps/office-viewer/public/assets");
const SITE_TILES = join(__dirname, "../apps/site/public/assets/tiles");

mkdirSync(ASSETS, { recursive: true });

// Copy Room_Builder from site
copyFileSync(
  join(SITE_TILES, "Room_Builder_Office_16x16.png"),
  join(ASSETS, "Room_Builder_Office_16x16.png")
);
console.log("Copied Room_Builder_Office_16x16.png");

// TSX files (Tiled tileset definitions)
const ROOM_TSX = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.8" tiledversion="1.8.2" name="Room_Builder_Office" tilewidth="16" tileheight="16" spacing="0" tilecount="224" columns="16">
 <image source="Room_Builder_Office_16x16.png" width="256" height="224"/>
</tileset>`;

const MODERN_TSX = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.8" tiledversion="1.8.2" name="Modern_Office" tilewidth="16" tileheight="16" spacing="0" tilecount="339" columns="15">
 <image source="Modern_Office_16x16.png" width="240" height="368"/>
</tileset>`;

writeFileSync(join(ASSETS, "Room_Builder_Office.tsx"), ROOM_TSX);
writeFileSync(join(ASSETS, "Modern_Office.tsx"), MODERN_TSX);
console.log("Wrote Room_Builder_Office.tsx, Modern_Office.tsx");

// Run stitch (creates Modern_Office_16x16.png) and generate-officemap
const { execSync } = await import("child_process");
execSync("node scripts/stitch-modern-office.mjs", { cwd: join(__dirname, ".."), stdio: "inherit" });
execSync("pnpm generate-officemap", { cwd: join(__dirname, ".."), stdio: "inherit" });
console.log("Office assets ready at apps/office-viewer/public/assets/");
