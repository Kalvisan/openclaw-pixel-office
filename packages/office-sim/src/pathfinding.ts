/**
 * BFS pathfinding for 2D grid
 */

import type { Tile } from "./map.js";

export interface Point {
  x: number;
  y: number;
}

export function bfsPath(
  grid: Tile[][],
  start: Point,
  end: Point
): Point[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = new Set<string>();
  const queue: { p: Point; path: Point[] }[] = [{ p: start, path: [start] }];
  visited.add(`${start.x},${start.y}`);

  const dirs = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const { p, path } = queue.shift()!;
    if (p.x === end.x && p.y === end.y) return path;

    for (const [dx, dy] of dirs) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const tile = grid[ny]?.[nx];
      if (!tile?.walkable) continue;
      visited.add(key);
      queue.push({ p: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
    }
  }
  return [];
}
