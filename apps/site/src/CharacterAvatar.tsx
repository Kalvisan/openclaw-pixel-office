/**
 * Layered character avatar - MV Character Generator
 * Layers: body -> outfit -> hair -> eyes (144x384, 48x96 per frame - rectangle)
 * Uses img elements for reliable layer compositing
 */

import type { CharacterAppearance } from "@openclaw-office/core";
import { getCharacterFiles, DEFAULT_CHARACTER } from "./characterAssets";

const FRAME_W = 48;
const FRAME_H = 96;
const SHEET_W = 144;
const SHEET_H = 384;

interface Props {
  character?: CharacterAppearance | null;
  name: string;
  size?: number;
  /** Idle - show standing frame (middle column) instead of walk cycle */
  animated?: boolean;
  /** Show only this layer - for picker previews so each category shows its own part */
  onlyLayer?: "body" | "outfit" | "hair" | "eyes";
}

export function CharacterAvatar({ character, name, size = 64, animated = false, onlyLayer }: Props) {
  const app = character ?? DEFAULT_CHARACTER;
  const files = getCharacterFiles(app);

  // Idle = standing frame (col 1), walk = col 0
  const col = animated ? 1 : 0;
  const row = 0;
  const scale = size / FRAME_W; // scale by width
  const sheetW = SHEET_W * scale;
  const sheetH = SHEET_H * scale;
  const offsetX = -col * FRAME_W * scale;
  const offsetY = -row * FRAME_H * scale;

  const layerStyle: React.CSSProperties = {
    position: "absolute",
    left: offsetX,
    top: offsetY,
    width: sheetW,
    height: sheetH,
    pointerEvents: "none",
  };

  const displayH = (FRAME_H / FRAME_W) * size;

  return (
    <div
      style={{
        width: size,
        height: displayH,
        overflow: "hidden",
        position: "relative",
      }}
      title={name}
    >
      <div
        className="pixel-art"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        {(!onlyLayer || onlyLayer === "body") && <img src={files.body} alt="" className="pixel-art" style={layerStyle} />}
        {(!onlyLayer || onlyLayer === "outfit") && <img src={files.outfit} alt="" className="pixel-art" style={layerStyle} />}
        {(!onlyLayer || onlyLayer === "hair") && <img src={files.hair} alt="" className="pixel-art" style={layerStyle} />}
        {(!onlyLayer || onlyLayer === "eyes") && <img src={files.eyes} alt="" className="pixel-art" style={layerStyle} />}
      </div>
    </div>
  );
}
