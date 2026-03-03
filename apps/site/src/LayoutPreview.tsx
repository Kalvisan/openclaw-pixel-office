/**
 * Office layout preview - read-only display of how the office will look.
 * No editing, just shows the layout scaled to fit the container.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { getSpriteXY, SHEETS } from "./interiorTiles";
import { getSheetCols, getSheetRows } from "./tileSheets";
import {
  buildRoomLayout,
  drawLayout,
  stringGridToRoomMask,
  TILE_SIZE,
} from "./room-builder-office-16x16";

const EMPTY_TILE = "";

function loadSheetImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

interface Props {
  layout: OfficeLayout | null;
}

export function LayoutPreview({ layout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sheetImages, setSheetImages] = useState<Record<string, HTMLImageElement>>({});
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCollisions, setShowCollisions] = useState(false);
  const [showSpots, setShowSpots] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [layout]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {};
      if (width > 0 && height > 0) setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const roomMask = useMemo(() => {
    if (layout?.roomMask) return layout.roomMask;
    if (layout?.layers?.[0]) return stringGridToRoomMask(layout.layers[0]);
    return [];
  }, [layout?.roomMask, layout?.layers]);

  const effectiveWidth = layout?.width ?? roomMask[0]?.length ?? 40;
  const effectiveHeight = layout?.height ?? roomMask?.length ?? 25;

  const objectLayers = useMemo(() => {
    const layers = layout?.layers ?? [];
    return layers.slice(1);
  }, [layout?.layers]);

  const spots = useMemo(() => {
    const s = layout?.spots;
    return {
      desk: s?.desk ?? [],
      chair: s?.chair ?? [],
      meeting: s?.meeting ?? [],
      closet: s?.closet ?? [],
    };
  }, [layout?.spots]);

  const roomLayout = useMemo(
    () =>
      buildRoomLayout(roomMask, {
        floorMaterial: layout?.floorMaterial ?? "grayTile",
        isWall: (v: number) => v === 0,
      }),
    [roomMask, layout?.floorMaterial]
  );

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";

    const DISPLAY_SCALE = 2;
    const ZOOM_FACTOR = 1.4; // Slight zoom for readability; use pan to navigate

    const roomRows = getSheetRows("room");
    const roomCols = getSheetCols("room");
    const interiorRows = getSheetRows("interior");
    const interiorCols = getSheetCols("interior");
    const drawTile = (
      ctx: CanvasRenderingContext2D,
      tileId: string,
      dx: number,
      dy: number
    ) => {
      if (!tileId.startsWith("in_")) return;
      const m = tileId.match(/^in_(\d+)_(\d+)$/);
      if (!m) return;
      const row = parseInt(m[1], 10);
      const col = parseInt(m[2], 10);
      if (row >= interiorRows || col >= interiorCols) return;
      const img = sheetImages.interior;
      if (!img) return;
      const { x: sx, y: sy } = getSpriteXY(col, row, "interior");
      ctx.drawImage(
        img,
        sx,
        sy,
        TILE_SIZE,
        TILE_SIZE,
        dx,
        dy,
        TILE_SIZE,
        TILE_SIZE
      );
    };

    const contentW = effectiveWidth * TILE_SIZE * DISPLAY_SCALE;
    const contentH = effectiveHeight * TILE_SIZE * DISPLAY_SCALE;

    // Canvas keeps content aspect ratio (square tiles); fit into container
    const containerW = containerSize ? Math.max(1, Math.floor(containerSize.w)) : contentW;
    const containerH = containerSize ? Math.max(1, Math.floor(containerSize.h)) : contentH;
    const fitScale = Math.min(containerW / contentW, containerH / contentH);
    const scale = fitScale * ZOOM_FACTOR;
    const canvasW = Math.max(1, Math.floor(contentW * scale));
    const canvasH = Math.max(1, Math.floor(contentH * scale));
    const padX = (canvasW - contentW * scale) / 2;
    const padY = (canvasH - contentH * scale) / 2;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(padX + pan.x, padY + pan.y);
    ctx.scale(scale, scale);
    ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
    const floorLayer = layout?.layers?.[0];
    const hasRbTiles = floorLayer?.some((row: string[]) =>
      row?.some((c: string) => c?.startsWith("rb_"))
    );
    if (hasRbTiles && floorLayer && sheetImages.room) {
      for (let gy = 0; gy < effectiveHeight; gy++) {
        for (let gx = 0; gx < effectiveWidth; gx++) {
          const tileId = floorLayer[gy]?.[gx];
          if (!tileId?.startsWith("rb_")) continue;
          const m = tileId.match(/^rb_(\d+)_(\d+)$/);
          if (!m) continue;
          const row = parseInt(m[1], 10);
          const col = parseInt(m[2], 10);
          if (row >= roomRows || col >= roomCols) continue;
          const { x: sx, y: sy } = getSpriteXY(col, row, "room");
          ctx.drawImage(
            sheetImages.room,
            sx,
            sy,
            TILE_SIZE,
            TILE_SIZE,
            gx * TILE_SIZE,
            gy * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      }
    } else {
      drawLayout(ctx, sheetImages.room ?? null, roomLayout, 0, 0);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(padX + pan.x, padY + pan.y);
    ctx.scale(scale, scale);
    ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
    for (let li = 0; li < objectLayers.length; li++) {
      const layer = objectLayers[li];
      for (let gy = 0; gy < effectiveHeight; gy++) {
        for (let gx = 0; gx < effectiveWidth; gx++) {
          const tileId = layer[gy]?.[gx];
          if (!tileId || tileId === EMPTY_TILE) continue;
          const dx = gx * TILE_SIZE;
          const dy = gy * TILE_SIZE;
          drawTile(ctx, tileId, dx, dy);
        }
      }
    }
    ctx.restore();

    // Collisions: red border + semi-transparent fill on blocked tiles
    let blockedSet: Set<string>;
    if (layout?.collision?.blocked?.length) {
      blockedSet = new Set(
        layout.collision.blocked.map((b) => `${b.x},${b.y}`)
      );
    } else {
      blockedSet = new Set<string>();
      for (let li = 0; li < objectLayers.length; li++) {
        const layer = objectLayers[li];
        for (let gy = 0; gy < effectiveHeight; gy++) {
          for (let gx = 0; gx < effectiveWidth; gx++) {
            if (layer[gy]?.[gx] && layer[gy][gx] !== EMPTY_TILE) {
              blockedSet.add(`${gx},${gy}`);
            }
          }
        }
      }
    }
    if (showCollisions && blockedSet.size > 0) {
      ctx.save();
      ctx.translate(padX + pan.x, padY + pan.y);
      ctx.scale(scale, scale);
      ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
      ctx.strokeStyle = "rgba(255, 80, 80, 1)";
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(255, 80, 80, 0.25)";
      for (let gy = 0; gy < effectiveHeight; gy++) {
        for (let gx = 0; gx < effectiveWidth; gx++) {
          if (!blockedSet.has(`${gx},${gy}`)) continue;
          const dx = gx * TILE_SIZE;
          const dy = gy * TILE_SIZE;
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
          ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
        }
      }
      ctx.restore();
    }

    // Spots: small dot + text label
    if (showSpots) {
        const spotColors: Record<string, string> = {
        desk: "rgba(100, 180, 255, 0.9)",
        chair: "rgba(100, 255, 150, 0.9)",
        meeting: "rgba(255, 200, 100, 0.9)",
        closet: "rgba(180, 100, 255, 0.9)",
      };
      const spotLabels: Record<string, string> = {
        desk: "work",
        chair: "sit",
        meeting: "meet",
        closet: "find",
      };
      ctx.save();
      ctx.translate(padX + pan.x, padY + pan.y);
      ctx.scale(scale, scale);
      ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
      ctx.font = "8px 'VT323', monospace";
      ctx.textBaseline = "middle";
      for (const [spotType, positions] of Object.entries(spots) as [
        string,
        { x: number; y: number }[],
      ][]) {
        const color = spotColors[spotType];
        const label = spotLabels[spotType] ?? spotType;
        for (const { x, y } of positions) {
          const tx = Math.floor(x) * TILE_SIZE;
          const ty = Math.floor(y) * TILE_SIZE;
          const dotSize = 4;
          const dotX = tx + 2;
          const dotY = ty + TILE_SIZE / 2 - dotSize / 2;
          ctx.fillStyle = color;
          ctx.fillRect(dotX, dotY, dotSize, dotSize);
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillText(label, dotX + dotSize + 2, ty + TILE_SIZE / 2);
        }
      }
      ctx.restore();
    }
  }, [
    layout,
    roomLayout,
    objectLayers,
    spots,
    sheetImages,
    effectiveWidth,
    effectiveHeight,
    containerSize,
    pan,
    showCollisions,
    showSpots,
  ]);

  // Panning: drag to move view
  const handleMouseDown = (e: React.MouseEvent) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  };
  const handleMouseUp = () => {
    panStartRef.current = null;
    setIsDragging(false);
  };
  const handleMouseLeave = () => {
    panStartRef.current = null;
    setIsDragging(false);
  };

  if (!layout) {
    return (
      <div className="game-panel layout-preview-panel" style={{ padding: 20 }}>
        <h2 className="game-font-title section-title" style={{ fontSize: 10, marginBottom: 8, color: "var(--game-gold)" }}>
          Office Preview
        </h2>
        <p className="section-hint" style={{ color: "var(--game-muted)" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="game-panel layout-preview-panel" style={{ padding: 20 }}>
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
        Office Preview
      </h2>
      <p className="section-hint" style={{ marginBottom: 12 }}>
        How your office will look in the exported game. Drag to pan.
      </p>
      <div
        className="layout-preview-toggles"
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <label
          className="game-checkbox-label"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 11,
            color: "var(--game-text-dim)",
          }}
        >
          <input
            type="checkbox"
            className="game-checkbox"
            checked={showCollisions}
            onChange={(e) => setShowCollisions(e.target.checked)}
          />
          Collisions
        </label>
        <label
          className="game-checkbox-label"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 11,
            color: "var(--game-text-dim)",
          }}
        >
          <input
            type="checkbox"
            className="game-checkbox"
            checked={showSpots}
            onChange={(e) => setShowSpots(e.target.checked)}
          />
          Spots
        </label>
      </div>
      <div className="layout-preview-wrap">
        <div
          ref={containerRef}
          className="layout-preview-inner"
          style={{
            aspectRatio: `${effectiveWidth} / ${effectiveHeight}`,
            width: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            height: "auto",
          }}
        >
          <canvas
            ref={canvasRef}
            className="layout-preview-canvas"
            style={{
              display: "block",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          title="Drag to pan"
          />
        </div>
      </div>
    </div>
  );
}
