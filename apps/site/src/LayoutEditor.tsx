/**
 * Office layout builder - 2D Canvas WYSIWYG
 * Uses room-builder system for floor/walls (semantic + shadows).
 * Object layers: Desks, Chairs, Decors.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { officeDesignJsonToOfficeLayout, officeLayoutToOfficeDesignJson } from "@openclaw-office/zipgen";
import {
  OBJECTS_BY_CATEGORY,
  getSpriteXY,
  TILES_BY_ID,
  SHEETS,
  getObjectCells,
} from "./interiorTiles";
import { LAYOUT_JSON_URL } from "./assets";
import {
  buildRoomLayout,
  drawLayout,
  layoutToFloorGrid,
  stringGridToRoomMask,
  type FloorMaterialName,
  FLOOR_MATERIALS,
  TILE_SIZE,
} from "./room-builder-office-16x16";

const GRID_WIDTH = 40;
const GRID_HEIGHT = 25;
const DISPLAY_SCALE = 2;
const TOOLBAR_TILE_PX = 36;

const EMPTY_TILE = "";

/** Room mask: 1 = floor/inside, 0 = wall/outside */
function createDefaultRoomMask(w = GRID_WIDTH, h = GRID_HEIGHT): number[][] {
  return Array(h)
    .fill(null)
    .map((_, y) =>
      Array(w)
        .fill(0)
        .map((_, x) =>
          y > 0 && y < h - 1 && x > 0 && x < w - 1 ? 1 : 0
        )
    );
}

function createEmptyObjectLayer(w = GRID_WIDTH, h = GRID_HEIGHT): string[][] {
  return Array(h)
    .fill(null)
    .map(() => Array(w).fill(EMPTY_TILE));
}

function cloneRoomMask(mask: number[][]): number[][] {
  return mask.map((row) => [...row]);
}

function cloneLayers(layers: string[][][]): string[][][] {
  return layers.map((l) => l.map((r) => [...r]));
}

/** Default empty spots */
const EMPTY_SPOTS: NonNullable<OfficeLayout["spots"]> = {
  desk: [],
  chair: [],
  meeting: [],
  closet: [],
};

interface Props {
  layout: OfficeLayout | null;
  onChange: (layout: OfficeLayout) => void;
}

type Category = keyof typeof OBJECTS_BY_CATEGORY;

function loadSheetImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export type EditorMode = "layout" | "spots";

export function LayoutEditor({ layout, onChange }: Props) {
  const [editorMode, setEditorMode] = useState<EditorMode>("layout");
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedSpotType, setSelectedSpotType] = useState<
    keyof typeof EMPTY_SPOTS | null
  >(null);
  const [activeCategory, setActiveCategory] = useState<Category>("desk");
  const [floorBrush, setFloorBrush] = useState<"floor" | "wall">("floor");
  const [floorMaterial, setFloorMaterial] = useState<FloorMaterialName>("grayTile");
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("modern_office");
  const [sheetImages, setSheetImages] = useState<Record<string, HTMLImageElement>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const roomMask = useMemo(() => {
    if (layout?.roomMask) return layout.roomMask;
    if (layout?.layers?.[0]) {
      return stringGridToRoomMask(layout.layers[0]);
    }
    return createDefaultRoomMask();
  }, [layout?.roomMask, layout?.layers]);

  const effectiveWidth = layout?.width ?? roomMask[0]?.length ?? GRID_WIDTH;
  const effectiveHeight = layout?.height ?? roomMask?.length ?? GRID_HEIGHT;

  const floorMaterialFromLayout = layout?.floorMaterial ?? "grayTile";

  const objectLayers = useMemo(() => {
    const layers = layout?.layers ?? [createEmptyObjectLayer(effectiveWidth, effectiveHeight)];
    return layers.slice(1);
  }, [layout?.layers, effectiveWidth, effectiveHeight]);

  const isFloorLayer = activeLayerIndex === 0;

  const spots = useMemo(() => {
    const s = layout?.spots ?? EMPTY_SPOTS;
    return {
      desk: s.desk ?? [],
      chair: s.chair ?? [],
      meeting: s.meeting ?? [],
      closet: s.closet ?? [],
    };
  }, [layout?.spots]);

  useEffect(() => {
    setFloorMaterial(floorMaterialFromLayout);
  }, [floorMaterialFromLayout]);

  useEffect(() => {
    const urls = Object.fromEntries(
      Object.entries(SHEETS).map(([id, s]) => [id, s.url])
    );
    Promise.all(
      Object.entries(urls).map(([id, url]) =>
        loadSheetImage(url).then((img) => [id, img] as const)
      )
    )
      .then((entries) => setSheetImages(Object.fromEntries(entries)))
      .catch(console.error);
  }, []);

  const setFloorCell = useCallback(
    (gx: number, gy: number, value: 0 | 1) => {
      setSelectedPresetId(null);
      const nextMask = cloneRoomMask(roomMask);
      nextMask[gy][gx] = value;
      const floor = layoutToFloorGrid(
        buildRoomLayout(nextMask, {
          floorMaterial,
          isWall: (v) => v === 0,
        }),
        effectiveWidth,
        effectiveHeight
      );
      onChange({
        width: effectiveWidth,
        height: effectiveHeight,
        roomMask: nextMask,
        floorMaterial,
        layers: [floor, ...objectLayers],
        spots,
      });
    },
    [roomMask, floorMaterial, objectLayers, spots, onChange, effectiveWidth, effectiveHeight]
  );

  const setObjectTile = useCallback(
    (gx: number, gy: number, objectId: string | null) => {
      setSelectedPresetId(null);
      const layerIndex = activeLayerIndex - 1;
      const nextLayers = cloneLayers([createEmptyObjectLayer(effectiveWidth, effectiveHeight), ...objectLayers]);
      const layer = nextLayers[layerIndex + 1];
      if (!layer) return;
      if (!objectId) {
        layer[gy][gx] = EMPTY_TILE;
      } else {
        const cells = getObjectCells(objectId);
        if (!cells) return;
        for (const cell of cells) {
          const x = gx + cell.dx;
          const y = gy + cell.dy;
          if (x >= 0 && x < effectiveWidth && y >= 0 && y < effectiveHeight) {
            layer[y][x] = cell.tileId;
          }
        }
      }
      const floor = layoutToFloorGrid(
        buildRoomLayout(roomMask, {
          floorMaterial,
          isWall: (v) => v === 0,
        }),
        effectiveWidth,
        effectiveHeight
      );
      onChange({
        width: effectiveWidth,
        height: effectiveHeight,
        roomMask,
        floorMaterial,
        layers: [floor, ...nextLayers.slice(1)],
        spots,
      });
    },
    [roomMask, floorMaterial, objectLayers, activeLayerIndex, spots, onChange, effectiveWidth, effectiveHeight]
  );

  const setSpot = useCallback(
    (gx: number, gy: number, spotType: keyof typeof EMPTY_SPOTS | null) => {
      const next: typeof spots = {
        desk: spots.desk.filter((p: { x: number; y: number }) => !(p.x === gx && p.y === gy)),
        chair: spots.chair.filter((p: { x: number; y: number }) => !(p.x === gx && p.y === gy)),
        meeting: spots.meeting.filter((p: { x: number; y: number }) => !(p.x === gx && p.y === gy)),
        closet: spots.closet.filter((p: { x: number; y: number }) => !(p.x === gx && p.y === gy)),
      };
      if (spotType === "desk") next.desk.push({ x: gx, y: gy });
      else if (spotType === "chair") next.chair.push({ x: gx, y: gy });
      else if (spotType === "meeting") next.meeting.push({ x: gx, y: gy });
      else if (spotType === "closet") next.closet.push({ x: gx, y: gy });
      const floor = layoutToFloorGrid(
        buildRoomLayout(roomMask, {
          floorMaterial,
          isWall: (v) => v === 0,
        }),
        effectiveWidth,
        effectiveHeight
      );
      onChange({
        width: effectiveWidth,
        height: effectiveHeight,
        roomMask,
        floorMaterial,
        layers: [floor, ...objectLayers],
        spots: next,
      });
    },
    [roomMask, floorMaterial, objectLayers, spots, onChange, effectiveWidth, effectiveHeight]
  );

  const canvasPixelW = effectiveWidth * TILE_SIZE * DISPLAY_SCALE;
  const canvasPixelH = effectiveHeight * TILE_SIZE * DISPLAY_SCALE;

  const fitToScreen = useCallback(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    if (r.width < 50 || r.height < 50) return;
    const scale = Math.min(
      (r.width - 24) / canvasPixelW,
      (r.height - 24) / canvasPixelH,
      2
    );
    setZoom(Math.max(0.25, Math.min(2, scale)));
  }, [canvasPixelW, canvasPixelH]);

  useEffect(() => {
    const t = setTimeout(fitToScreen, 100);
    return () => clearTimeout(t);
  }, [effectiveWidth, effectiveHeight, fitToScreen]);

  const getCellFromEvent = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const tileDisplayPx = TILE_SIZE * DISPLAY_SCALE;
    const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const gx = Math.floor(canvasX / tileDisplayPx);
    const gy = Math.floor(canvasY / tileDisplayPx);
    if (gx >= 0 && gx < effectiveWidth && gy >= 0 && gy < effectiveHeight)
      return { gx, gy };
    return null;
  }, [effectiveWidth, effectiveHeight]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const cell = getCellFromEvent(e);
      if (cell) {
        setIsDrawing(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        if (editorMode === "spots") {
          setSpot(cell.gx, cell.gy, selectedSpotType);
        } else if (isFloorLayer) {
          setFloorCell(cell.gx, cell.gy, floorBrush === "floor" ? 1 : 0);
        } else {
          setObjectTile(cell.gx, cell.gy, selectedTileId);
        }
      }
    },
    [
      editorMode,
      isFloorLayer,
      floorBrush,
      selectedTileId,
      selectedSpotType,
      setFloorCell,
      setObjectTile,
      setSpot,
      getCellFromEvent,
    ]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      const cell = getCellFromEvent(e);
      if (cell) {
        if (editorMode === "spots") {
          setSpot(cell.gx, cell.gy, selectedSpotType);
        } else if (isFloorLayer) {
          setFloorCell(cell.gx, cell.gy, floorBrush === "floor" ? 1 : 0);
        } else {
          setObjectTile(cell.gx, cell.gy, selectedTileId);
        }
      }
    },
    [
      isDrawing,
      editorMode,
      isFloorLayer,
      floorBrush,
      selectedTileId,
      selectedSpotType,
      setFloorCell,
      setObjectTile,
      setSpot,
      getCellFromEvent,
    ]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsDrawing(false);
  }, []);

  const resetLayout = useCallback(() => {
    setSelectedPresetId("modern_office");
    setActiveLayerIndex(0);
    fetch(LAYOUT_JSON_URL)
      .then((res) => res.json())
      .then((data) => {
        const layout =
          data.version != null && data.world?.bounds
            ? officeDesignJsonToOfficeLayout(data)
            : data;
        onChange(layout);
      })
      .catch((err) => {
        console.error("Failed to load Modern Office:", err);
      });
  }, [onChange]);

  const addObjectLayer = useCallback(() => {
    const floor = layoutToFloorGrid(
      buildRoomLayout(roomMask, {
        floorMaterial,
        isWall: (v) => v === 0,
      }),
      effectiveWidth,
      effectiveHeight
    );
    const nextLayers = [...objectLayers, createEmptyObjectLayer(effectiveWidth, effectiveHeight)];
    setActiveLayerIndex(nextLayers.length);
    onChange({
      width: effectiveWidth,
      height: effectiveHeight,
      roomMask,
      floorMaterial,
      layers: [floor, ...nextLayers],
      spots,
    });
  }, [roomMask, floorMaterial, objectLayers, spots, onChange, effectiveWidth, effectiveHeight]);

  const removeObjectLayer = useCallback(() => {
    if (activeLayerIndex < 1) return;
    const floor = layoutToFloorGrid(
      buildRoomLayout(roomMask, {
        floorMaterial,
        isWall: (v) => v === 0,
      }),
      effectiveWidth,
      effectiveHeight
    );
    const nextLayers = objectLayers.filter((_: string[][], i: number) => i !== activeLayerIndex - 1);
    setActiveLayerIndex(Math.min(activeLayerIndex, nextLayers.length));
    onChange({
      width: effectiveWidth,
      height: effectiveHeight,
      roomMask,
      floorMaterial,
      layers: [floor, ...nextLayers],
      spots,
    });
  }, [roomMask, floorMaterial, objectLayers, activeLayerIndex, spots, onChange, effectiveWidth, effectiveHeight]);

  const changeFloorMaterial = useCallback(
    (mat: FloorMaterialName) => {
      setFloorMaterial(mat);
      const floor = layoutToFloorGrid(
        buildRoomLayout(roomMask, {
          floorMaterial: mat,
          isWall: (v) => v === 0,
        }),
        effectiveWidth,
        effectiveHeight
      );
      onChange({
        width: effectiveWidth,
        height: effectiveHeight,
        roomMask,
        floorMaterial: mat,
        layers: [floor, ...objectLayers],
        spots,
      });
    },
    [roomMask, objectLayers, spots, onChange, effectiveWidth, effectiveHeight]
  );

  const roomLayout = useMemo(
    () =>
      buildRoomLayout(roomMask, {
        floorMaterial,
        isWall: (v) => v === 0,
      }),
    [roomMask, floorMaterial]
  );

  const baseSize = TILE_SIZE * DISPLAY_SCALE;
  const destSize = baseSize + 1;

  const drawTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tileId: string,
      dx: number,
      dy: number
    ) => {
      const def = TILES_BY_ID.get(tileId);
      if (!def || !def.sheet) return;
      const img = sheetImages[def.sheet];
      if (!img) return;
      const { x: sx, y: sy } = getSpriteXY(def.col, def.row, def.sheet);
      ctx.drawImage(
        img,
        sx,
        sy,
        TILE_SIZE,
        TILE_SIZE,
        dx,
        dy,
        destSize,
        destSize
      );
    },
    [sheetImages]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";

    const bufferW = effectiveWidth * TILE_SIZE * DISPLAY_SCALE;
    const bufferH = effectiveHeight * TILE_SIZE * DISPLAY_SCALE;

    canvas.width = bufferW;
    canvas.height = bufferH;
    canvas.style.width = `${bufferW}px`;
    canvas.style.height = `${bufferH}px`;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, bufferW, bufferH);

    ctx.save();
    ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
    const floorLayer = layout?.layers?.[0];
    const hasRbTiles = floorLayer?.some((row: string[]) => row?.some((c: string) => c?.startsWith("rb_")));
    if (hasRbTiles && floorLayer && sheetImages.room) {
      for (let gy = 0; gy < effectiveHeight; gy++) {
        for (let gx = 0; gx < effectiveWidth; gx++) {
          const tileId = floorLayer[gy]?.[gx];
          if (!tileId?.startsWith("rb_")) continue;
          const m = tileId.match(/^rb_(\d+)_(\d+)$/);
          if (!m) continue;
          const row = parseInt(m[1], 10);
          const col = parseInt(m[2], 10);
          const sx = col * TILE_SIZE;
          const sy = row * TILE_SIZE;
          ctx.drawImage(
            sheetImages.room,
            sx, sy, TILE_SIZE, TILE_SIZE,
            gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE
          );
        }
      }
    } else {
      drawLayout(ctx, sheetImages.room ?? null, roomLayout, 0, 0);
    }
    ctx.restore();

    for (let li = 0; li < objectLayers.length; li++) {
      const layer = objectLayers[li];
      for (let gy = 0; gy < effectiveHeight; gy++) {
        for (let gx = 0; gx < effectiveWidth; gx++) {
          const tileId = layer[gy]?.[gx];
          if (!tileId || tileId === EMPTY_TILE) continue;
          const dx = Math.floor(gx * baseSize);
          const dy = Math.floor(gy * baseSize);
          drawTile(ctx, tileId, dx, dy);
        }
      }
    }

    const spotColors: Record<keyof typeof spots, string> = {
      desk: "rgba(100, 180, 255, 0.4)",
      chair: "rgba(100, 255, 150, 0.4)",
      meeting: "rgba(255, 200, 100, 0.4)",
      closet: "rgba(180, 100, 255, 0.4)",
    };
    for (const [spotType, positions] of Object.entries(spots) as [
      keyof typeof spots,
      { x: number; y: number }[],
    ][]) {
      const color = spotColors[spotType];
      for (const { x, y } of positions) {
        const dx = Math.floor(x * baseSize);
        const dy = Math.floor(y * baseSize);
        ctx.fillStyle = color;
        ctx.fillRect(dx, dy, destSize, destSize);
      }
    }
  }, [layout?.layers, roomLayout, objectLayers, spots, sheetImages, drawTile, effectiveWidth, effectiveHeight]);

  const categoryLabels: Record<Category, string> = {
    decor: "Decors",
    desk: "Desks",
    chair: "Chairs/sofas",
  };

  return (
    <div className="game-panel" style={{ padding: 20 }}>
      <h2
        className="game-font-title section-title"
        style={{
          fontSize: 10,
          marginBottom: 8,
          color: "var(--game-gold)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        Office Layout
      </h2>
      <p className="section-hint" style={{ marginBottom: 12 }}>
        Room-builder floor/walls + furniture. Paint room shape, then add objects.
      </p>

      <div
        className="layout-mode-section"
        style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}
      >
        <span style={{ fontSize: 11, color: "var(--game-muted)" }}>Mode:</span>
        <button
          type="button"
          className={`game-btn-secondary ${editorMode === "layout" ? "active" : ""}`}
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => setEditorMode("layout")}
        >
          Layout (tiles)
        </button>
        <button
          type="button"
          className={`game-btn-secondary ${editorMode === "spots" ? "active" : ""}`}
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => setEditorMode("spots")}
        >
          Spots (assign locations)
        </button>
      </div>

      {editorMode === "layout" && (
        <div
          className="layout-layer-section"
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--game-muted)" }}>Layer:</span>
          <button
            type="button"
            className={`game-btn-secondary ${activeLayerIndex === 0 ? "active" : ""}`}
            style={{ padding: "4px 10px", fontSize: 11 }}
            onClick={() => setActiveLayerIndex(0)}
          >
            Floor
          </button>
          {objectLayers.map((_: string[][], i: number) => (
            <button
              key={i}
              type="button"
              className={`game-btn-secondary ${activeLayerIndex === i + 1 ? "active" : ""}`}
              style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => setActiveLayerIndex(i + 1)}
            >
              Objects {i + 1}
            </button>
          ))}
          <button
            type="button"
            className="game-btn-secondary"
            style={{ padding: "4px 8px", fontSize: 10 }}
            onClick={addObjectLayer}
          >
            + Add layer
          </button>
          {activeLayerIndex >= 1 && (
            <button
              type="button"
              className="game-btn-secondary"
              style={{ padding: "4px 8px", fontSize: 10, color: "var(--game-error)" }}
              onClick={removeObjectLayer}
            >
              Remove layer
            </button>
          )}
        </div>
      )}

      {editorMode === "spots" && (
        <div
          className="layout-spots-picker"
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--game-muted)" }}>
            Spot type:
          </span>
          {(["desk", "chair", "meeting", "closet"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`layout-tile-btn ${selectedSpotType === t ? "selected" : ""}`}
              style={{
                padding: "6px 12px",
                fontSize: 11,
                backgroundColor:
                  selectedSpotType === t ? "var(--game-gold)" : "transparent",
                color: selectedSpotType === t ? "#0a0a0f" : "inherit",
              }}
              onClick={() =>
                setSelectedSpotType(selectedSpotType === t ? null : t)
              }
            >
              {t === "desk" ? "Desk" : t === "chair" ? "Chair" : t === "meeting" ? "Meeting" : "Closet"}
            </button>
          ))}
          <button
            type="button"
            className="game-btn-secondary"
            style={{ padding: "4px 8px", fontSize: 10 }}
            onClick={() => setSelectedSpotType(null)}
          >
            Clear cell
          </button>
        </div>
      )}

      <div className="layout-preset-section" style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <label htmlFor="layout-preset-select" className="layout-preset-label">
          Layout preset:
        </label>
        <select
          id="layout-preset-select"
          className="layout-preset-select"
          value={selectedPresetId ?? "custom"}
          onChange={async (e) => {
            const id = e.target.value;
            if (id === "custom") return;
            if (id === "modern_office") {
              setSelectedPresetId("modern_office");
              try {
                const res = await fetch(LAYOUT_JSON_URL);
                const data = await res.json();
                const layout =
                  data.version != null && data.world?.bounds
                    ? officeDesignJsonToOfficeLayout(data)
                    : data;
                onChange(layout);
              } catch (err) {
                console.error("Failed to load Modern Office preset:", err);
                alert("Could not load Modern Office preset.");
              }
            }
          }}
        >
          <option value="modern_office">Modern Office</option>
          <option value="custom">(custom – edited)</option>
        </select>
        <button
          type="button"
          className="game-btn-secondary layout-reset-btn"
          onClick={resetLayout}
        >
          Reset
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const json = JSON.parse(reader.result as string);
                const converted = officeDesignJsonToOfficeLayout(json);
                setSelectedPresetId(null);
                onChange(converted);
              } catch (err) {
                console.error("Failed to import Office Design JSON:", err);
                alert("Invalid JSON format. Expected Office Design JSON (Room Builder v4).");
              }
            };
            reader.readAsText(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="game-btn-secondary"
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => importInputRef.current?.click()}
        >
          Import
        </button>
        <button
          type="button"
          className="game-btn-secondary"
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => {
            if (!layout) return;
            const json = officeLayoutToOfficeDesignJson(layout);
            const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "office-design.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!layout}
        >
          Export (Office Design format)
        </button>
      </div>

      <div className="layout-builder">
        <div
          className="layout-toolbar"
          style={{ display: editorMode === "layout" ? "flex" : "none" }}
        >
          <div className="layout-toolbar-top">
            {isFloorLayer ? (
              <div
                className="layout-floor-toolbar"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--game-muted)" }}>
                  Brush:
                </span>
                <button
                  type="button"
                  className={`game-btn-secondary ${floorBrush === "floor" ? "active" : ""}`}
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={() => setFloorBrush("floor")}
                >
                  Floor
                </button>
                <button
                  type="button"
                  className={`game-btn-secondary ${floorBrush === "wall" ? "active" : ""}`}
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={() => setFloorBrush("wall")}
                >
                  Wall
                </button>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--game-muted)",
                    marginLeft: 8,
                  }}
                >
                  Material:
                </span>
                <select
                  value={floorMaterial}
                  onChange={(e) =>
                    changeFloorMaterial(e.target.value as FloorMaterialName)
                  }
                  className="layout-preset-select"
                  style={{ padding: "4px 8px", fontSize: 11 }}
                >
                  {(Object.keys(FLOOR_MATERIALS) as FloorMaterialName[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {FLOOR_MATERIALS[k].name}
                      </option>
                    )
                  )}
                </select>
              </div>
            ) : (
              <div className="layout-category-tabs">
                {(Object.keys(OBJECTS_BY_CATEGORY) as Category[]).map((cat) => (
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
            )}
            {!isFloorLayer && (
              <div className="layout-toolbar-actions">
                <button
                  type="button"
                  className={`layout-tile-btn layout-eraser-btn ${selectedTileId === null ? "selected" : ""}`}
                  onClick={() => setSelectedTileId(null)}
                  title="Eraser"
                >
                  <span className="layout-asset-preview-eraser">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M20 20H7L3 16a2 2 0 0 1 0-2.83L14.17 2a2 2 0 0 1 2.83 0L21 6.17a2 2 0 0 1 0 2.83L14 16" />
                      <path d="M18 13 9 4" />
                    </svg>
                  </span>
                </button>
              </div>
            )}
          </div>
          {!isFloorLayer && (
            <div className="layout-tiles-scroll-wrap">
              <div className="layout-tiles-row">
                {OBJECTS_BY_CATEGORY[activeCategory].map((obj) => {
                  const tile = TILES_BY_ID.get(obj.previewTileId);
                  if (!tile || !tile.sheet) return null;
                  const { x: sx, y: sy } = getSpriteXY(
                    tile.col,
                    tile.row,
                    tile.sheet
                  );
                  const sheet = SHEETS[tile.sheet];
                  const scale = TOOLBAR_TILE_PX / TILE_SIZE;
                  const isSelected = selectedTileId === obj.id;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      className={`layout-tile-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedTileId(obj.id)}
                      title={
                        obj.label +
                        (obj.width > 1 || obj.height > 1
                          ? ` (${obj.width}×${obj.height})`
                          : "")
                      }
                    >
                      <span
                        className="layout-tile-preview"
                        style={{
                          backgroundImage: `url(${sheet.url})`,
                          backgroundPosition: `-${sx * scale}px -${sy * scale}px`,
                          backgroundSize: `${sheet.width * scale}px ${sheet.height * scale}px`,
                          backgroundRepeat: "no-repeat",
                          width: TOOLBAR_TILE_PX,
                          height: TOOLBAR_TILE_PX,
                          overflow: "hidden",
                          display: "block",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="layout-canvas-wrap" ref={canvasWrapRef}>
          <div className="layout-canvas-zoom-bar">
            <button type="button" className="game-btn-secondary" onClick={fitToScreen} title="Fit to screen">
              Fit
            </button>
            <button
              type="button"
              className="game-btn-secondary"
              onClick={() => setZoom(1)}
              title="100%"
            >
              100%
            </button>
            <button
              type="button"
              className="game-btn-secondary"
              onClick={() => setZoom((z) => Math.min(2, z * 1.25))}
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="game-btn-secondary"
              onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))}
              title="Zoom out"
            >
              −
            </button>
            <span className="layout-zoom-label">{Math.round(zoom * 100)}%</span>
          </div>
          <div
            className="layout-canvas-scroll"
            style={{
              width: canvasPixelW * zoom,
              height: canvasPixelH * zoom,
              minWidth: canvasPixelW * 0.25,
              minHeight: canvasPixelH * 0.25,
            }}
          >
            <canvas
              ref={canvasRef}
              className="layout-canvas-2d"
              width={canvasPixelW}
              height={canvasPixelH}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ cursor: "crosshair" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
