# Empty Office Map Format

Reference format for an empty office (floor + walls, no furniture). Used by 2D map editors and runtime.

## Structure

- **version**: 2
- **tileSize**: 16×16
- **tileset**: Room_Builder_Office_16x16.png (16 cols × 14 rows, 224 tiles)
- **world**: infinite, bounds (minX, maxX, minY, maxY)
- **camera**: x, y, zoom
- **layers**: base (floor/walls), objects (furniture)
- **collision**: blocked tiles, rules (walkable/blocked)

## Tile ID

`tileId` is 0-indexed: `tileId = row * 16 + col` in the Room_Builder sheet.

## Files

- `empty-office.json` – minimal template (empty layers)
- Full example: see user-provided JSON with populated Layer 0 (floor + walls)
