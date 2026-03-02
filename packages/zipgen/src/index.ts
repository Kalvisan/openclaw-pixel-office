/**
 * Zip generator - creates openclaw-office project structure
 * Used by site builder
 */

import { strToU8, zipSync, type Zippable } from "fflate";
import { serialize } from "@openclaw-office/toon";
import type { Agent } from "@openclaw-office/core";

const INSTALL_MD = `# OpenClaw Pixel Office - Installation

## Quick start

1. \`git clone\` this repo or extract the zip
2. Copy \`.env.example\` to \`.env\` and configure OpenClaw endpoint
3. \`pnpm install && pnpm build\`
4. \`pnpm dev\` to start runtime

## OpenClaw endpoint

Set \`OPENCLAW_URL\` in .env (e.g. http://localhost:3000)

## Structure

- \`agents/\` - Agent definitions (.toon) with role, spots, character appearance
- \`plans/templates/\` - Plan templates
- \`office/\` - Office layout (layout.toon) with auto spots: desk, chair, closet, meeting
- \`office/rpgjs/\` - RPGJS map (officemap.tmx) + tilesets for in-game view
- \`runtime/\` - Config and docker-compose (optional)
- \`ui/\` - Runtime build output

## RPGJS office map

When an office layout is configured, the zip includes \`office/rpgjs/\` with:
- officemap.tmx - Tiled map for RPGJS v4
- Room_Builder_Office.tsx, Modern_Office.tsx - Tilesets
- PNG tileset images

Copy these to your RPGJS project's main/worlds/maps/ to use the office in-game.
`;

/** Floor material for room-builder system */
export type FloorMaterialName = "purpleStone" | "grayTile" | "brownBrick" | "paleLilac";

/** Multi-layer layout: layer 0 = floor (rb_* only), layers 1+ = objects (in_*) stacked */
export interface OfficeLayout {
  width: number;
  height: number;
  /** Room mask: 1 = floor/inside, 0 = wall/outside. Convert to layers before passing to zipgen. */
  roomMask?: number[][];
  /** Floor material when using roomMask */
  floorMaterial?: FloorMaterialName;
  /** @deprecated Use layers. Kept for backward compat - migrated to layers on load */
  tiles?: string[][];
  /** layers[0] = floor (rb_* walls/floors), layers[1+] = furniture/objects (in_*) */
  layers?: string[][][];
  spots?: Record<string, { x: number; y: number }[]>;
}

/** Room_Builder firstgid=1, 224 tiles (16×14). Modern_Office_Black_Shadow firstgid=225, 339 tiles (15×23). */
const ROOM_COLS = 16;
const INTERIOR_COLS = 15;
const ROOM_FIRSTGID = 1;
const INTERIOR_FIRSTGID = 225;

function tileIdToGid(tileId: string): number {
  if (tileId.startsWith("rb_")) {
    const m = tileId.match(/^rb_(\d+)_(\d+)$/);
    if (!m) return 0;
    const row = parseInt(m[1], 10);
    const col = parseInt(m[2], 10);
    return ROOM_FIRSTGID + row * ROOM_COLS + col;
  }
  if (tileId.startsWith("in_")) {
    const m = tileId.match(/^in_(\d+)_(\d+)$/);
    if (!m) return 0;
    const row = parseInt(m[1], 10);
    const col = parseInt(m[2], 10);
    return INTERIOR_FIRSTGID + row * INTERIOR_COLS + col;
  }
  return 0;
}

/** Normalize layout to layers format. Migrates legacy tiles to layers. */
export function getLayoutLayers(layout: OfficeLayout): string[][][] {
  if (layout.layers && layout.layers.length > 0) {
    return layout.layers;
  }
  const tiles = layout.tiles ?? [];
  const h = layout.height ?? 25;
  const w = layout.width ?? 40;
  const floor: string[][] = Array(h).fill(null).map(() => Array(w).fill(""));
  const furniture: string[][] = Array(h).fill(null).map(() => Array(w).fill(""));
  const defaultFloor = "rb_6_0";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y]?.[x] ?? "";
      if (t.startsWith("rb_")) {
        floor[y][x] = t;
      } else if (t.startsWith("in_")) {
        floor[y][x] = defaultFloor;
        furniture[y][x] = t;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!floor[y][x]) floor[y][x] = defaultFloor;
    }
  }
  return [floor, furniture];
}

/** Convert OfficeLayout to Tiled TMX XML for RPGJS. */
export function officeLayoutToTMX(layout: OfficeLayout): string {
  const { width, height } = layout;
  const layers = getLayoutLayers(layout);
  const layerData = (gids: number[]) => {
    const bytes = new Uint8Array(gids.length * 4);
    const view = new DataView(bytes.buffer);
    gids.forEach((gid, i) => view.setUint32(i * 4, gid, true));
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const floorLayer = layers[0] ?? [];
  const floorGids: number[] = [];
  const wallGids: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileId = floorLayer[y]?.[x] ?? "";
      const gid = tileId ? tileIdToGid(tileId) : 0;
      if (tileId.startsWith("rb_")) {
        const row = parseInt(tileId.match(/^rb_(\d+)_/)?.[1] ?? "99", 10);
        if (row <= 5) {
          floorGids.push(0);
          wallGids.push(gid);
        } else {
          floorGids.push(gid);
          wallGids.push(0);
        }
      } else {
        floorGids.push(tileIdToGid("rb_6_0"));
        wallGids.push(0);
      }
    }
  }

  const floorData = layerData(floorGids);
  const wallData = layerData(wallGids);

  const objectLayerParts: string[] = [];
  for (let i = 1; i < layers.length; i++) {
    const objLayer = layers[i] ?? [];
    const gids: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = objLayer[y]?.[x] ?? "";
        if (tileId.startsWith("in_")) {
          gids.push(tileIdToGid(tileId));
        } else {
          gids.push(0);
        }
      }
    }
    objectLayerParts.push(` <layer id="${i + 2}" name="objects_${i}" width="${width}" height="${height}">
  <data encoding="base64">
   ${layerData(gids)}
  </data>
 </layer>`);
  }

  const nextLayerId = 2 + layers.length;
  return `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.9" tiledversion="1.9.2" orientation="orthogonal" renderorder="right-down" width="${width}" height="${height}" tilewidth="16" tileheight="16" infinite="0" nextlayerid="${nextLayerId + 1}" nextobjectid="1">
 <tileset firstgid="1" source="Room_Builder_Office.tsx"/>
 <tileset firstgid="225" source="Modern_Office.tsx"/>
 <layer id="1" name="floor" width="${width}" height="${height}">
  <data encoding="base64">
   ${floorData}
  </data>
 </layer>
 <layer id="2" name="walls" width="${width}" height="${height}">
  <data encoding="base64">
   ${wallData}
  </data>
 </layer>
${objectLayerParts.join("\n")}
 <objectgroup id="${nextLayerId}" name="spawn">
  <object id="1" name="start" class="start" x="32" y="32">
   <point/>
  </object>
 </objectgroup>
</map>`;
}

const ROOM_TSX = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.8" tiledversion="1.8.2" name="Room_Builder_Office" tilewidth="16" tileheight="16" spacing="0" tilecount="224" columns="16">
 <image source="Room_Builder_Office_16x16.png" width="256" height="224"/>
</tileset>`;

const MODERN_OFFICE_TSX = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.8" tiledversion="1.8.2" name="Modern_Office" tilewidth="16" tileheight="16" spacing="0" tilecount="339" columns="15">
 <image source="Modern_Office_16x16.png" width="240" height="368"/>
</tileset>`;

export interface ZipConfig {
  agents: Agent[];
  planTemplates?: Record<string, unknown>[];
  runtimeConfig?: Record<string, unknown>;
  officeLayout?: OfficeLayout;
  /** PNG bytes for RPGJS tilesets. When provided with officeLayout, TMX + tilesets included in office/rpgjs/ */
  rpgjsAssets?: { roomPng: Uint8Array; interiorsPng: Uint8Array };
}

export function generateZip(config: ZipConfig): Uint8Array {
  const files: Zippable = {};
  const prefix = "openclaw-office/";

  // Agents
  for (const agent of config.agents) {
    const path = `${prefix}agents/${agent.id}.toon`;
    files[path] = strToU8(toonAgent(agent));
  }

  // Plan templates
  if (config.planTemplates?.length) {
    for (let i = 0; i < config.planTemplates.length; i++) {
      const t = config.planTemplates[i];
      const path = `${prefix}plans/templates/template_${i}.toon`;
      files[path] = strToU8(serialize(t));
    }
  }

  // Office layout (custom map)
  if (config.officeLayout) {
    files[`${prefix}office/layout.toon`] = strToU8(serialize(config.officeLayout));
    // RPGJS map for office (TMX + tilesets)
    const rpgPrefix = `${prefix}office/rpgjs/`;
    files[`${rpgPrefix}officemap.tmx`] = strToU8(officeLayoutToTMX(config.officeLayout));
    files[`${rpgPrefix}Room_Builder_Office.tsx`] = strToU8(ROOM_TSX);
    files[`${rpgPrefix}Modern_Office.tsx`] = strToU8(MODERN_OFFICE_TSX);
    if (config.rpgjsAssets) {
      files[`${rpgPrefix}Room_Builder_Office_16x16.png`] = config.rpgjsAssets.roomPng;
      files[`${rpgPrefix}Modern_Office_16x16.png`] = config.rpgjsAssets.interiorsPng;
    }
  }

  // Runtime config
  const configToon = config.runtimeConfig ?? {
    openclaw_url: "http://localhost:3000",
    feature_flags: {},
  };
  files[`${prefix}runtime/config.toon`] = strToU8(serialize(configToon));
  files[`${prefix}runtime/.env.example`] = strToU8(
    "OPENCLAW_URL=http://localhost:3000\n"
  );

  // INSTALL.md
  files[`${prefix}INSTALL.md`] = strToU8(INSTALL_MD);

  return zipSync(files, { level: 6 });
}

function toonAgent(a: Agent): string {
  const payload: Record<string, unknown> = {
    id: a.id,
    name: a.name,
    role: a.role,
    daily_checklist: a.daily_checklist ?? [],
    tools_allowed: a.tools_allowed ?? [],
    tone: a.tone ?? "professional",
    context_budget_tokens: a.context_budget_tokens ?? 4096,
    escalation_rules: a.escalation_rules ?? {},
    deps: a.deps ?? [],
    spots: a.spots ?? [],
  };
  if (a.character) payload.character = a.character;
  else if (a.sprite) payload.sprite = a.sprite;
  return serialize(payload);
}
