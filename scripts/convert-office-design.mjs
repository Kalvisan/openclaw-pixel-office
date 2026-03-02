#!/usr/bin/env node
/**
 * Convert Office Design JSON (Room Builder v4) to OfficeLayout.
 * Usage: node scripts/convert-office-design.mjs <input.json> [output.json]
 *
 * Example:
 *   node scripts/convert-office-design.mjs "E:/KALVIS/.../Office_Design_1.json" docs/office-layout.json
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import {
  officeDesignJsonToOfficeLayout,
  officeLayoutToOfficeDesignJson,
} from "../packages/zipgen/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const formatIdx = args.indexOf("--format");
const format = formatIdx >= 0 ? args[formatIdx + 1] : "officelayout";
const inputPath = args[0];
const outputPath = args[1];

if (!inputPath) {
  console.error(
    "Usage: node scripts/convert-office-design.mjs <input.json> [output.json] [--format office-design|officelayout]"
  );
  process.exit(1);
}

const json = JSON.parse(readFileSync(resolve(inputPath), "utf-8"));
const layout = officeDesignJsonToOfficeLayout(json);

const out = outputPath ?? join(__dirname, "../docs/office-layout-converted.json");
const output =
  format === "office-design"
    ? officeLayoutToOfficeDesignJson(layout)
    : layout;
writeFileSync(out, JSON.stringify(output, null, 2), "utf-8");

console.log(`Converted: ${layout.width}x${layout.height} grid`);
console.log(`  Layers: ${layout.layers?.length ?? 0}`);
console.log(
  `  Spots: desk=${layout.spots?.desk?.length ?? 0}, chair=${layout.spots?.chair?.length ?? 0}, closet=${layout.spots?.closet?.length ?? 0}`
);
console.log(`  Collision blocked: ${layout.collision?.blocked?.length ?? 0}`);
console.log(`  Output format: ${format}`);
console.log(`Written to ${out}`);
