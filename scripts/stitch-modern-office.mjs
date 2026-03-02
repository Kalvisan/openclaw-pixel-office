#!/usr/bin/env node
/**
 * Extract 15×23 tile region from Modern_Office_Black_Shadow.png for RPGJS tileset.
 * Output: apps/rpgjs/main/worlds/maps/Modern_Office_16x16.png
 * Layout: 15 cols, 23 rows (240×368 px)
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dirname, "../apps/site/public/assets/tiles/Modern_Office_Black_Shadow.png");
const OUT_PATH = join(__dirname, "../apps/rpgjs/main/worlds/maps/Modern_Office_16x16.png");

const WIDTH = 240;
const HEIGHT = 368;

async function main() {
  const out = await sharp(SOURCE)
    .extract({ left: 0, top: 0, width: WIDTH, height: HEIGHT })
    .png()
    .toBuffer();
  writeFileSync(OUT_PATH, out);
  console.log("Written:", OUT_PATH);
}

main().catch(console.error);
