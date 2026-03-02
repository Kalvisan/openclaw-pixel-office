# Office Viewer

Lightweight 2D tilemap viewer for office layouts. Uses **PixiJS** + **pixi-tiledmap** – fast WebGL rendering, minimal API, good fit for tile-based office maps.

## Run

```bash
pnpm setup-office-assets   # Generate tiles + TMX (once)
pnpm dev:office-viewer    # http://localhost:5176
```

## Assets

- `officemap.tmx` – Tiled map (from `pnpm generate-officemap`)
- `Room_Builder_Office_16x16.png`, `Modern_Office_16x16.png` – tilesets
- `*.tsx` – Tiled tileset definitions
