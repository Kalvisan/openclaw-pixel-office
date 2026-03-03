/**
 * Zip generator - creates OpenClaw AgentPack structure (free-sample-v1.2.0 layout)
 * Used by site builder
 */

import { strToU8, zipSync, type Zippable } from "fflate";
import { serialize } from "@openclaw-office/toon";
import type { Agent } from "@openclaw-office/core";
import { agentToIdentityMd, agentToSoulMd } from "./agent-pack-content";
import {
  SOUL_PACK_DEFAULTS,
  USER_MD,
  TOOLS_MD,
  MEMORY_MD,
  HEARTBEAT_MD,
  OPENCLAW_CHANNELS_TEMPLATE,
} from "./agent-pack-templates";

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
  /** Blocked tiles for pathfinding (grid coords). From Office Design collision.blocked. */
  collision?: { blocked: { x: number; y: number }[] };
}

/** Office Design JSON (Room Builder export v4) – sparse tiles, world coords */
export interface OfficeDesignJson {
  version?: number;
  tileSize?: { width: number; height: number };
  files?: Record<string, { imageName: string; imageWidth: number; imageHeight: number; columns: number; rows: number; totalTiles?: number }>;
  world?: { infinite?: boolean; bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number } };
  camera?: { x: number; y: number; zoom: number };
  layers?: Array<{
    id?: number;
    name?: string;
    type?: string;
    tilesetKey?: string;
    tiles?: Array<{ x: number; y: number; tileId?: number }>;
  }>;
  collision?: { blocked?: Array<{ x: number; y: number; blocked?: number }> };
  spots?: { items?: Array<{ x: number; y: number; type?: string; label?: string | null }> };
}

/** Convert Office Design JSON (v4) to OfficeLayout. World coords → grid coords. */
export function officeDesignJsonToOfficeLayout(json: OfficeDesignJson): OfficeLayout {
  const bounds = json.world?.bounds ?? { minX: -20, maxX: 20, minY: -14, maxY: 14 };
  const minX = bounds.minX ?? -20;
  const maxX = bounds.maxX ?? 20;
  const minY = bounds.minY ?? -14;
  const maxY = bounds.maxY ?? 14;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const toGrid = (x: number, y: number) => ({ x: x - minX, y: y - minY });

  const floor: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(""));
  const objectLayers: string[][][] = [];

  for (const layer of json.layers ?? []) {
    const tilesetKey = layer.tilesetKey ?? layer.type ?? "base";
    const tiles = layer.tiles ?? [];
    if (tilesetKey === "base") {
      for (const t of tiles) {
        const tid = t.tileId ?? 0;
        const { x, y } = toGrid(t.x, t.y);
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const row = Math.floor(tid / 16);
          const col = tid % 16;
          floor[y][x] = `rb_${row}_${col}`;
        }
      }
    } else {
      const objLayer: string[][] = Array(height)
        .fill(null)
        .map(() => Array(width).fill(""));
      for (const t of tiles) {
        const tid = t.tileId ?? 0;
        const { x, y } = toGrid(t.x, t.y);
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const row = Math.floor(tid / 16);
          const col = tid % 16;
          objLayer[y][x] = `in_${row}_${col}`;
        }
      }
      objectLayers.push(objLayer);
    }
  }

  // Empty floor cells stay empty (render as black/nothing)

  const spots: Record<string, { x: number; y: number }[]> = {
    desk: [],
    chair: [],
    meeting: [],
    closet: [],
  };
  const spotMap: Record<string, keyof typeof spots> = {
    work: "desk",
    sit: "chair",
    find: "closet",
  };
  for (const item of json.spots?.items ?? []) {
    const type = (item.type ?? "sit").toLowerCase();
    const key = spotMap[type] ?? "chair";
    const { x, y } = toGrid(item.x, item.y);
    if (y >= 0 && y < height && x >= 0 && x < width) {
      spots[key].push({ x, y });
    }
  }

  const collision = {
    blocked: (json.collision?.blocked ?? []).map((b) => toGrid(b.x, b.y)),
  };

  return {
    width,
    height,
    layers: [floor, ...objectLayers],
    spots,
    collision: collision.blocked.length > 0 ? collision : undefined,
  };
}

/** Convert OfficeLayout to Office Design JSON (v4) – sparse tiles, world coords. */
export function officeLayoutToOfficeDesignJson(layout: OfficeLayout): OfficeDesignJson {
  const width = layout.width ?? 40;
  const height = layout.height ?? 25;
  const layers = getLayoutLayers(layout);
  const minX = 0;
  const maxX = width - 1;
  const minY = 0;
  const maxY = height - 1;

  const toWorld = (gx: number, gy: number) => ({ x: gx + minX, y: gy + minY });

  const result: OfficeDesignJson = {
    version: 4,
    tileSize: { width: 16, height: 16 },
    files: {
      base: {
        imageName: "Room_Builder_Office_16x16.png",
        imageWidth: 256,
        imageHeight: 224,
        columns: 16,
        rows: 14,
        totalTiles: 224,
      },
      assets: {
        imageName: "Modern_Office_Black_Shadow.png",
        imageWidth: 256,
        imageHeight: 848,
        columns: 16,
        rows: 53,
        totalTiles: 848,
      },
    },
    world: { infinite: true, bounds: { minX, maxX, minY, maxY } },
    camera: { x: width / 2, y: height / 2, zoom: 2 },
    layers: [],
    collision: { blocked: [] },
    spots: { items: [] },
  };

  const baseTiles: Array<{ x: number; y: number; tileId: number }> = [];
  const floorLayer = layers[0] ?? [];
  for (let gy = 0; gy < height; gy++) {
    for (let gx = 0; gx < width; gx++) {
      const t = floorLayer[gy]?.[gx];
      if (!t?.startsWith("rb_")) continue;
      const m = t.match(/^rb_(\d+)_(\d+)$/);
      if (!m) continue;
      const row = parseInt(m[1], 10);
      const col = parseInt(m[2], 10);
      const { x, y } = toWorld(gx, gy);
      baseTiles.push({ x, y, tileId: row * 16 + col });
    }
  }
  result.layers!.push({
    id: 0,
    name: "Layer 0",
    type: "base",
    tilesetKey: "base",
    tiles: baseTiles,
  });

  for (let li = 1; li < layers.length; li++) {
    const objLayer = layers[li] ?? [];
    const tiles: Array<{ x: number; y: number; tileId: number }> = [];
    for (let gy = 0; gy < height; gy++) {
      for (let gx = 0; gx < width; gx++) {
        const t = objLayer[gy]?.[gx];
        if (!t?.startsWith("in_")) continue;
        const m = t.match(/^in_(\d+)_(\d+)$/);
        if (!m) continue;
        const row = parseInt(m[1], 10);
        const col = parseInt(m[2], 10);
        const { x, y } = toWorld(gx, gy);
        tiles.push({ x, y, tileId: row * 16 + col });
      }
    }
    result.layers!.push({
      id: li,
      name: `Layer ${li}`,
      type: "assets",
      tilesetKey: "assets",
      tiles,
    });
  }

  const spotTypeMap: Record<string, string> = {
    desk: "work",
    chair: "sit",
    closet: "find",
    meeting: "sit",
  };
  for (const [key, positions] of Object.entries(layout.spots ?? {})) {
    for (const p of positions) {
      const { x, y } = toWorld(p.x, p.y);
      result.spots!.items!.push({
        x,
        y,
        type: spotTypeMap[key] ?? "sit",
        label: null,
      });
    }
  }

  for (const b of layout.collision?.blocked ?? []) {
    const { x, y } = toWorld(b.x, b.y);
    result.collision!.blocked!.push({ x, y, blocked: 1 });
  }

  return result;
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
  /** PNG bytes for office map tilesets. When provided with officeLayout, TMX + tilesets included in office/map/ */
  mapAssets?: { roomPng: Uint8Array; interiorsPng: Uint8Array };
}

/** Default model for openclaw.json */
const DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514";

function agentsToAgentsMd(agents: Agent[]): string {
  const lines = [
    "# AGENTS.md — Team Overview",
    "",
    "| Agent | Role | Emoji |",
    "|-------|------|-------|",
    ...agents.map((a) => `| ${a.name} | ${a.role} | ${a.emoji ?? "🤖"} |`),
    "",
    "## Setup",
    "",
    "Each agent has its own workspace under `workflow-<id>/` with IDENTITY.md and SOUL.md.",
    "Edit `openclaw.json` to change models or add agents.",
  ];
  return lines.join("\n");
}

function agentsToOpenclawConfig(agents: Agent[]): string {
  const list = agents.map((a) => ({
    id: a.id,
    name: a.name,
    workspace: `./workflow-${a.id}`,
    model: DEFAULT_MODEL,
    identity: {
      name: a.name,
      theme: a.theme ?? a.role,
      emoji: a.emoji ?? "🤖",
    },
  }));
  return JSON.stringify({ agents: { list } }, null, 2);
}

const README_MD = `# OpenClaw Agent Pack

Generated by OpenClaw Pixel Office.

## Quick Start

1. Extract this zip
2. Edit \`USER.md\` with your profile
3. Edit \`openclaw.json\` if needed (models, endpoints)
4. Run your OpenClaw runtime with this pack as workspace

## Structure (free-sample layout)

- \`agents/<id>/\` — IDENTITY.md, SOUL.md per agent
- \`AGENTS.md\` — Team overview
- \`SOUL.md\` — Pack defaults (shared principles)
- \`openclaw-config.json\` — Agent list, models, workspaces
- \`USER.md\`, \`TOOLS.md\`, \`MEMORY.md\`, \`HEARTBEAT.md\` — Templates

## Office Layout (optional)

If this pack includes \`office/\`, it contains:
- \`layout.toon\` — Office layout with spots
- \`map/\` — TMX map + tilesets for 2D office visualization (PixiJS, Phaser, etc.)
`;

export function generateZip(config: ZipConfig): Uint8Array {
  const files: Zippable = {};
  const prefix = "";

  // Agents — AgentPack format: agents/<id>/IDENTITY.md, agents/<id>/SOUL.md
  for (const agent of config.agents) {
    const workspaceDir = `workflow-${agent.id}`;
    const agentPrefix = `${workspaceDir}/`;
    files[`${agentPrefix}IDENTITY.md`] = strToU8(agentToIdentityMd(agent));
    files[`${agentPrefix}SOUL.md`] = strToU8(agentToSoulMd(agent));
  }

  // Root — free-sample layout
  files[`${prefix}AGENTS.md`] = strToU8(agentsToAgentsMd(config.agents));
  files[`${prefix}openclaw.json`] = strToU8(agentsToOpenclawConfig(config.agents));
  files[`${prefix}README.md`] = strToU8(README_MD);
  files[`${prefix}SOUL.md`] = strToU8(SOUL_PACK_DEFAULTS);
  files[`${prefix}USER.md`] = strToU8(USER_MD);
  files[`${prefix}TOOLS.md`] = strToU8(TOOLS_MD);
  files[`${prefix}MEMORY.md`] = strToU8(MEMORY_MD);
  files[`${prefix}HEARTBEAT.md`] = strToU8(HEARTBEAT_MD);
  files[`${prefix}openclaw-channels.template.json5`] = strToU8(OPENCLAW_CHANNELS_TEMPLATE);

  // Plan templates (optional)
  if (config.planTemplates?.length) {
    for (let i = 0; i < config.planTemplates.length; i++) {
      const t = config.planTemplates[i];
      files[`${prefix}plans/templates/template_${i}.toon`] = strToU8(serialize(t));
    }
  }

  // Office layout (optional)
  if (config.officeLayout) {
    files[`${prefix}office/layout.toon`] = strToU8(serialize(config.officeLayout));
    const mapPrefix = `${prefix}office/map/`;
    files[`${mapPrefix}officemap.tmx`] = strToU8(officeLayoutToTMX(config.officeLayout));
    files[`${mapPrefix}Room_Builder_Office.tsx`] = strToU8(ROOM_TSX);
    files[`${mapPrefix}Modern_Office.tsx`] = strToU8(MODERN_OFFICE_TSX);
    if (config.mapAssets) {
      files[`${mapPrefix}Room_Builder_Office_16x16.png`] = config.mapAssets.roomPng;
      files[`${mapPrefix}Modern_Office_16x16.png`] = config.mapAssets.interiorsPng;
    }
  }

  // Runtime config (optional, for pixel-office runtime)
  const configToon = config.runtimeConfig ?? {
    openclaw_url: "http://localhost:3000",
    feature_flags: {},
  };
  files[`${prefix}runtime/config.toon`] = strToU8(serialize(configToon));
  files[`${prefix}runtime/.env.example`] = strToU8(
    "OPENCLAW_URL=http://localhost:3000\n"
  );

  return zipSync(files, { level: 6 });
}

