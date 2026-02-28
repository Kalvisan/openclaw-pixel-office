/**
 * 2D office map - type-based tiles
 * floor: walkable
 * wall: blocked
 * desk: multi-tile, chair_spot (1 person)
 * sofa: multi-tile, seat_spots (1 per)
 * locker: multi-tile, shared access
 */

export type TileType = "floor" | "wall" | "desk" | "sofa" | "locker" | "meeting";

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  walkable: boolean;
  spots?: { x: number; y: number }[]; // chair_spot, seat_spots
}

export interface MapConfig {
  width: number;
  height: number;
  tiles: TileType[][];
  spots?: Record<string, { x: number; y: number }[]>;
}

export function createMap(config: MapConfig): Tile[][] {
  const grid: Tile[][] = [];
  for (let y = 0; y < config.height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < config.width; x++) {
      const type = config.tiles[y]?.[x] ?? "wall";
      const walkable = type !== "wall";
      const spots = config.spots?.[`${x},${y}`];
      row.push({ type, x, y, walkable, spots });
    }
    grid.push(row);
  }
  return grid;
}
