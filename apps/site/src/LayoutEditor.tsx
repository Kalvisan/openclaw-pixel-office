/**
 * Office layout builder - interior tileset sidebar + grid canvas
 * Uses 16x16px sprite sheet with 1px margin
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import {
  TILES_BY_CATEGORY,
  getSpriteXY,
  getSimType,
  TILES_BY_ID,
  SHEETS,
} from "./interiorTiles";
import { LAYOUT_PRESETS } from "./layoutPresets";

const GRID_WIDTH = 40;
const GRID_HEIGHT = 25;
const GRID_TILE_PX = 16; // display size per cell (matches source tiles)
const SIDEBAR_TILE_PX = 32; // larger tiles in sidebar for easier selection

const EMPTY_TILE = "";

function createEmptyTiles(): string[][] {
  return Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(EMPTY_TILE));
}

function buildSpotsFromTiles(tiles: string[][]): NonNullable<OfficeLayout["spots"]> {
  const spots: NonNullable<OfficeLayout["spots"]> = { desk: [], sofa: [], meeting: [], locker: [] };
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const simType = getSimType(tiles[y][x]);
      if (simType && simType !== "floor" && simType !== "wall") {
        spots[simType].push({ x, y });
      }
    }
  }
  return spots;
}

interface Props {
  layout: OfficeLayout | null;
  onChange: (layout: OfficeLayout) => void;
}

type Category = keyof typeof TILES_BY_CATEGORY;

export function LayoutEditor({ layout, onChange }: Props) {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("desk");
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("preset_office");
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const tiles = useMemo(() => {
    if (!layout?.tiles?.length) return createEmptyTiles();
    const h = layout.height ?? GRID_HEIGHT;
    const w = layout.width ?? GRID_WIDTH;
    const base = createEmptyTiles();
    for (let y = 0; y < Math.min(h, base.length); y++) {
      for (let x = 0; x < Math.min(w, base[0].length); x++) {
        const t = layout.tiles[y]?.[x];
        if (!t || t === EMPTY_TILE) base[y][x] = EMPTY_TILE;
        else if (TILES_BY_ID.has(t)) base[y][x] = t;
        else base[y][x] = t;
      }
    }
    return base;
  }, [layout]);

  const setTile = useCallback(
    (gx: number, gy: number, tileId: string | null) => {
      setSelectedPresetId(null); // User edited manually = custom layout
      const val = tileId ?? EMPTY_TILE;
      const next = tiles.map((row, y) =>
        y === gy ? row.map((c, x) => (x === gx ? val : c)) : [...row]
      );
      const spots = buildSpotsFromTiles(next);
      onChange({ width: GRID_WIDTH, height: GRID_HEIGHT, tiles: next, spots });
    },
    [tiles, onChange]
  );

  const getCellFromEvent = useCallback((e: React.PointerEvent) => {
    const el = gridRef.current ?? canvasRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_TILE_PX);
    const y = Math.floor((e.clientY - rect.top) / GRID_TILE_PX);
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) return { gx: x, gy: y };
    return null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const cell = getCellFromEvent(e);
      if (cell) {
        setIsDrawing(true);
        canvasRef.current?.setPointerCapture?.(e.pointerId);
        setTile(cell.gx, cell.gy, selectedTileId ?? null);
      }
    },
    [selectedTileId, setTile, getCellFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      const cell = getCellFromEvent(e);
      if (cell) setTile(cell.gx, cell.gy, selectedTileId ?? null);
    },
    [isDrawing, selectedTileId, setTile, getCellFromEvent]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
    setIsDrawing(false);
  }, []);

  const resetLayout = useCallback(() => {
    setSelectedPresetId("empty");
    onChange({
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      tiles: createEmptyTiles(),
      spots: buildSpotsFromTiles(createEmptyTiles()),
    });
  }, [onChange]);

  const categoryLabels: Record<Category, string> = {
    desk: "Desk",
    sofa: "Sofa",
    locker: "Locker",
    meeting: "Meeting",
    advanced: "Wall & Floor",
  };

  return (
    <div className="game-panel" style={{ padding: 20 }}>
      <h2 className="game-font-title section-title" style={{ fontSize: 10, marginBottom: 8, color: "var(--game-gold)", display: "flex", alignItems: "center", gap: 6 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        Office Layout
      </h2>
      <p className="section-hint" style={{ marginBottom: 12 }}>
        Pick a preset, or select a tool and click/drag on the grid to paint.
      </p>

      <div className="layout-preset-section" style={{ marginBottom: 16 }}>
        <label htmlFor="layout-preset-select" className="layout-preset-label">
          Layout preset:
        </label>
        <select
          id="layout-preset-select"
          className="layout-preset-select"
          value={selectedPresetId ?? "custom"}
          onChange={(e) => {
            const id = e.target.value;
            if (id === "custom") return;
            const preset = LAYOUT_PRESETS[id];
            if (preset) {
              setSelectedPresetId(id);
              onChange({ ...preset.layout, tiles: preset.layout.tiles.map((r) => [...r]) });
            }
          }}
        >
          {Object.entries(LAYOUT_PRESETS).map(([id, { name }]) => (
            <option key={id} value={id}>{name}</option>
          ))}
          <option value="custom">(custom – edited)</option>
        </select>
      </div>

      <div className="layout-builder">
        <aside className="layout-sidebar">
          <div className="layout-category-tabs">
            {(Object.keys(TILES_BY_CATEGORY) as Category[]).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`layout-cat-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          <div className="layout-tiles-grid">
            {TILES_BY_CATEGORY[activeCategory].map((t) => {
              const { x: sx, y: sy } = getSpriteXY(t.col, t.row, t.sheet);
              const sheet = SHEETS[t.sheet];
              const isSelected = selectedTileId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`layout-tile-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedTileId(t.id)}
                  title={t.label}
                >
                  <span
                    className="layout-tile-preview"
                    style={{
                      backgroundImage: `url(${sheet.url})`,
                      backgroundPosition: `-${sx}px -${sy}px`,
                      backgroundSize: `${sheet.width}px ${sheet.height}px`,
                      width: SIDEBAR_TILE_PX,
                      height: SIDEBAR_TILE_PX,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="layout-tools-row">
            <button
              type="button"
              className={`layout-tile-btn layout-eraser-btn ${selectedTileId === null ? "selected" : ""}`}
              onClick={() => setSelectedTileId(null)}
              title="Eraser"
            >
              <span className="layout-asset-preview-eraser">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 20H7L3 16a2 2 0 0 1 0-2.83L14.17 2a2 2 0 0 1 2.83 0L21 6.17a2 2 0 0 1 0 2.83L14 16" />
                  <path d="M18 13 9 4" />
                </svg>
              </span>
            </button>
          </div>
          <button type="button" className="game-btn-secondary layout-reset-btn" onClick={resetLayout}>
            Reset
          </button>
        </aside>

        <div
          className="layout-canvas-wrap"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            ref={gridRef}
            className="layout-canvas"
            style={{
              width: GRID_WIDTH * GRID_TILE_PX,
              height: GRID_HEIGHT * GRID_TILE_PX,
              gridTemplateColumns: `repeat(${GRID_WIDTH}, ${GRID_TILE_PX}px)`,
              gridTemplateRows: `repeat(${GRID_HEIGHT}, ${GRID_TILE_PX}px)`,
            }}
          >
            {tiles.flatMap((row, gy) =>
              row.map((tileId, gx) => {
                const isEmpty = !tileId || tileId === EMPTY_TILE;
                const def = isEmpty ? null : TILES_BY_ID.get(tileId);
                if (isEmpty || !def) {
                  return (
                    <div
                      key={`${gx}-${gy}`}
                      className="layout-cell layout-cell-empty"
                      style={{ width: GRID_TILE_PX, height: GRID_TILE_PX }}
                    />
                  );
                }
                const sheet = SHEETS[def.sheet];
                const { x: sx, y: sy } = getSpriteXY(def.col, def.row, def.sheet);
                return (
                  <div
                    key={`${gx}-${gy}`}
                    className="layout-cell"
                    style={{
                      backgroundImage: `url(${sheet.url})`,
                      backgroundPosition: `-${sx}px -${sy}px`,
                      backgroundSize: `${sheet.width}px ${sheet.height}px`,
                      width: GRID_TILE_PX,
                      height: GRID_TILE_PX,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
