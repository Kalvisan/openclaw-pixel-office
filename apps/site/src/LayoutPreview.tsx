/**
 * Office layout preview - read-only display of how the office will look.
 * No editing, just shows the layout scaled to fit the container.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { OfficeLayout } from "@openclaw-office/zipgen";
import { getSpriteXY, TILES_BY_ID, SHEETS } from "./interiorTiles";
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

    const baseSize = TILE_SIZE * 2;
    const destSize = baseSize;

    const drawTile = (
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
    };

    const bufferW = effectiveWidth * TILE_SIZE * 2;
    const bufferH = effectiveHeight * TILE_SIZE * 2;

    canvas.width = bufferW;
    canvas.height = bufferH;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, bufferW, bufferH);

    ctx.save();
    ctx.scale(2, 2);
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
          const sx = col * TILE_SIZE;
          const sy = row * TILE_SIZE;
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

    const spotColors: Record<string, string> = {
      desk: "rgba(100, 180, 255, 0.4)",
      chair: "rgba(100, 255, 150, 0.4)",
      meeting: "rgba(255, 200, 100, 0.4)",
      closet: "rgba(180, 100, 255, 0.4)",
    };
    for (const [spotType, positions] of Object.entries(spots) as [
      string,
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
  }, [
    layout,
    roomLayout,
    objectLayers,
    spots,
    sheetImages,
    effectiveWidth,
    effectiveHeight,
  ]);

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
        How your office will look in the exported game.
      </p>
      <div ref={containerRef} className="layout-preview-wrap">
        <canvas
          ref={canvasRef}
          className="layout-preview-canvas"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
    </div>
  );
}
