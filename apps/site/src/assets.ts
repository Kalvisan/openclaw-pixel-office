/**
 * Central asset paths - all assets live under /assets/
 * Vite serves public/ at root, so public/assets/ -> /assets/
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

export const ASSETS_BASE = "/assets";

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
