# Office Design JSON Format (Room Builder Export)

> **Source:** Modern_Office_Revamped Aseprite designs, exported as JSON  
> **Reference:** `Office_Design_1.json` (version 4 with collisions + spots)

## Overview

Office Design JSON describes a 2D tile-based office layout with:
- **Layers** – base (floor/walls) + assets (furniture) in sparse tile format
- **Collision** – blocked tiles for pathfinding
- **Spots** – NPC interaction points (sit, work, find)

## Version 4 Structure

```json
{
  "version": 4,
  "tileSize": { "width": 16, "height": 16 },
  "files": { "base": {...}, "assets": {...} },
  "world": { "infinite": true, "bounds": {...} },
  "camera": { "x", "y", "zoom" },
  "layers": [...],
  "collision": { "blocked": [...] },
  "spots": { "items": [...] }
}
```

## Coordinate System

- **World coordinates** – can be negative (e.g. x: -20..20, y: -14..14)
- **bounds** – `minX`, `maxX`, `minY`, `maxY` define the playable area
- **Grid** – each (x, y) is one 16×16 tile

To convert to 0-based grid for web UI:
- `gridX = x - bounds.minX`
- `gridY = y - bounds.minY`
- `width = maxX - minX + 1`, `height = maxY - minY + 1`

## Tilesets

| Key   | Image                         | Grid    | Tile ID formula      |
|-------|-------------------------------|---------|----------------------|
| base  | Room_Builder_Office_16x16.png | 16×14   | row×16 + col         |
| assets| Modern_Office_Black_Shadow.png| 16×53   | row×16 + col         |

## Layers

Each layer has:
- `id`, `name`, `type`, `tilesetKey` (base | assets)
- `tiles`: sparse array of `{ x, y, tileId }`

Only non-empty tiles are listed. Empty cells are implied.

**Layer order:**
- Layer 0: base (floor, walls, ceiling)
- Layers 1–3: assets (furniture, stacked)

## Collision

```json
"collision": {
  "blocked": [
    { "x": 9, "y": -4, "blocked": 1 },
    ...
  ]
}
```

- `blocked: 1` = tile is not walkable (wall, furniture, etc.)
- Used for pathfinding and movement validation

## Spots

```json
"spots": {
  "items": [
    { "x": -4, "y": -6, "type": "sit", "label": null },
    { "x": -7, "y": 6, "type": "work", "label": null },
    { "x": 11, "y": -6, "type": "find", "label": null }
  ]
}
```

| type  | Web UI mapping | Description                    |
|-------|-----------------|--------------------------------|
| sit   | chair           | NPC can sit (chairs, sofas)    |
| work  | desk            | NPC can work (desks)           |
| find  | closet          | NPC can search (bookshelves)   |

`label` – optional string for custom spot names.

## Conversion to OfficeLayout (Web UI)

The web UI uses `OfficeLayout` with:
- `width`, `height` – grid dimensions from bounds
- `layers` – dense 2D arrays `[y][x]` with tile IDs like `rb_6_0`, `in_0_0`
- `spots` – `{ desk: [{x,y}], chair: [...], meeting: [...], closet: [...] }`

Use `officeDesignJsonToOfficeLayout()` from `@openclaw-office/zipgen` to convert.

**CLI conversion (Office_Design → OfficeLayout):**
```bash
pnpm --filter @openclaw-office/zipgen build
node scripts/convert-office-design.mjs path/to/Office_Design_1.json [output.json]
```

**Export (OfficeLayout → Office_Design):** Use the "Export (Office Design format)" button in LayoutEditor, or `officeLayoutToOfficeDesignJson(layout)` from zipgen.

## Tile ID to String

- **base** (tileId 0–223): `rb_${row}_${col}` where row=⌊tileId/16⌋, col=tileId%16
- **assets** (tileId 0–847): `in_${row}_${col}` where row=⌊tileId/16⌋, col=tileId%16
