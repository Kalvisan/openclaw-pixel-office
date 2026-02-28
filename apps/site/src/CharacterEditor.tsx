/**
 * Character appearance editor - left: animated preview, right: pickers
 * Supports drag-to-scroll on picker grids
 */

import { useRef, useCallback } from "react";
import type { CharacterAppearance } from "@openclaw-office/core";
import { CharacterAvatar } from "./CharacterAvatar";
import { BODIES, OUTFITS, EYES, HAIRSTYLES, DEFAULT_CHARACTER, getCharacterUrl } from "./characterAssets";

interface Props {
  character: CharacterAppearance;
  onChange: (c: CharacterAppearance) => void;
}

const PREVIEW_SIZE = 48;
const FRAME_W = 48;
const FRAME_H = 96;
const SHEET_W = 144;
const SHEET_H = 384;

function LayerPreview({ url, size }: { url: string; size: number }) {
  const scale = size / FRAME_W;
  const displayH = (FRAME_H / FRAME_W) * size;
  return (
    <div
      className="pixel-art character-layer-preview"
      style={{
        width: size,
        height: displayH,
        backgroundImage: `url(${url})`,
        backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
        backgroundPosition: "0 0",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

const DRAG_THRESHOLD = 5;

function PickerGrid<T extends { id: string; file: string }>({
  items,
  category,
  value,
  onChange,
}: {
  items: T[];
  category: "bodies" | "outfits" | "eyes" | "hairstyles";
  value: string;
  onChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.clientX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    // Don't capture yet - only capture when user actually drags (past threshold)
    // This allows clicks on buttons to work normally
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!scrollRef.current || !isPointerDownRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      scrollRef.current.setPointerCapture(e.pointerId);
    }
    if (isDraggingRef.current) {
      scrollRef.current.scrollLeft = scrollLeftRef.current - dx;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (scrollRef.current && isDraggingRef.current) {
      scrollRef.current.releasePointerCapture(e.pointerId);
    }
    isPointerDownRef.current = false;
    // Reset isDraggingRef on next pointerDown so we don't block future clicks
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = false;
      } else {
        onChange(id);
      }
    },
    [onChange]
  );

  return (
    <div
      ref={scrollRef}
      className="character-picker-scroll character-picker-scroll-draggable"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="character-picker-grid">
        {items.map((item) => {
          const isSelected = value === item.id;
          const url = getCharacterUrl(category, item.file);
          return (
            <button
              key={item.id}
              type="button"
              className={`character-picker-btn ${isSelected ? "selected" : ""}`}
              onClick={(e) => handleClick(e, item.id)}
              title={item.id}
            >
              <LayerPreview url={url} size={PREVIEW_SIZE} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CharacterEditor({ character, onChange }: Props) {
  const app = character ?? DEFAULT_CHARACTER;

  return (
    <div className="character-editor-layout">
      <div className="character-editor-preview">
        <CharacterAvatar character={app} name="" size={128} animated />
      </div>
      <div className="character-editor-pickers">
        <div className="form-field">
          <label className="form-label">Body</label>
          <PickerGrid
            items={BODIES}
            category="bodies"
            value={app.body}
            onChange={(body) => onChange({ ...app, body })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Outfit</label>
          <PickerGrid
            items={OUTFITS}
            category="outfits"
            value={app.outfit}
            onChange={(outfit) => onChange({ ...app, outfit })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Hair / Hat</label>
          <PickerGrid
            items={HAIRSTYLES}
            category="hairstyles"
            value={app.hair}
            onChange={(hair) => onChange({ ...app, hair })}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Face</label>
          <PickerGrid
            items={EYES}
            category="eyes"
            value={app.eyes}
            onChange={(eyes) => onChange({ ...app, eyes })}
          />
        </div>
      </div>
    </div>
  );
}
