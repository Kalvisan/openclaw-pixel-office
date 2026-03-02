/**
 * Central asset paths - all assets live under /assets/
 * Vite serves public/ at root, so public/assets/ -> /assets/
 * Uses import.meta.env.BASE_URL for GitHub Pages subpath (e.g. /openclaw-pixel-office/)
 *
 * Structure:
 *   /assets/
 *   ├── tiles/           - Office layout
 *   │   ├── Room_Builder_Office_16x16.png (floors/walls)
 *   │   └── Modern_Office_Black_Shadow.png (interior objects)
 *   └── characters/      - MV Character Generator
 *       ├── bodies/
 *       ├── outfits/
 *       ├── eyes/
 *       └── hairstyles/
 */

const base = import.meta.env.BASE_URL ?? "/";
export const ASSETS_BASE = `${base}assets`.replace(/\/+/g, "/");
export const LAYOUT_JSON_URL = `${base}office-layout-converted.json`.replace(/\/+/g, "/");
export const ZIP_INSTALL_GUIDE_URL = `${base}zip-install-guide.md`.replace(/\/+/g, "/");

export const ASSETS = {
  tiles: {
    room: `${ASSETS_BASE}/tiles/Room_Builder_Office_16x16.png`,
    interior: `${ASSETS_BASE}/tiles/Modern_Office_Black_Shadow.png`,
  },
  characters: {
    base: `${ASSETS_BASE}/characters`,
    bodies: `${ASSETS_BASE}/characters/bodies`,
    outfits: `${ASSETS_BASE}/characters/outfits`,
    eyes: `${ASSETS_BASE}/characters/eyes`,
    hairstyles: `${ASSETS_BASE}/characters/hairstyles`,
  },
} as const;
