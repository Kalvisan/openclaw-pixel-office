# Office Map Export Format

Reference formats for office maps. Used by 2D map editors and runtime.

## Version 3 (9 desk spots)

- **version**: 3
- **files**: Multiple tilesets
  - `base`: Room_Builder_Office_16x16.png (floor + walls)
  - `assets`: Modern_Office_Black_Shadow.png (16×53, 848 tiles – furniture)
- **layers**: Each layer has `tilesetKey` (base | assets)
  - Layer 0: base (floor/walls)
  - Layers 1–3: assets (desks, chairs, decor)
- **spots**: `items`, `types` (sit, work, find)
- **collision**: blocked, rules

See `office-export-9-desks.json` for full structure (tiles truncated in template).

## Version 2 (empty)

- **version**: 2
- **tileSize**: 16×16
- **tileset**: Room_Builder_Office_16x16.png (16 cols × 14 rows, 224 tiles)
- **world**: infinite, bounds (minX, maxX, minY, maxY)
- **camera**: x, y, zoom
- **layers**: base (floor/walls), objects (furniture)
- **collision**: blocked tiles, rules (walkable/blocked)

## Tile ID

`tileId` is 0-indexed: `tileId = row * 16 + col` in the tileset sheet.
