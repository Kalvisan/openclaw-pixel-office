# Room_Builder_Office_16x16 – mapping specification

> **Implemented in:** `apps/site/src/roomBuilderOffice16Mapping.ts` + `room-builder-office-16x16.ts`
> **Reference:** Modern_Office_Revamped Office_Design_1.aseprite, Office_Design_2.aseprite

## Basics

- **Tileset:** Room_Builder_Office_16x16.png
- **Tile size:** 16×16
- **Grid:** 16 cols × 14 rows
- **Tile ID formula:** `tileId = row * 16 + col`

## Walls – 2 layers

- **wallFace** (body): base, leftEnd, rightEnd – visible vertical part
- **wallTop** (cap): top, topLeftEnd, topRightEnd – top edge (only when no wall above)

## Ceiling

```ts
CEILING.main      // regular segments
CEILING.tJunction // T junctions
CEILING.turn      // corners
```

## Floor

6 variants: base, fullShadow, leftShadow, topShadow, topLeftShadow, softTopLeftShadow.
Shadows only at top and left edges. `getFloorState(hasWallUp, hasWallLeft)`.

## Wall

6 variants: base, top, rightEnd, topRightEnd, leftEnd, topLeftEnd.
- Face: base, leftEnd, rightEnd
- Top: top, topLeftEnd, topRightEnd (when top edge is visible)
