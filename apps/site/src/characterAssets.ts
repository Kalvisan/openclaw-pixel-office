/**
 * MV Character Generator assets - body, outfit, hair, eyes
 * 144x384 sprite sheets, 48x96 per frame (3 cols x 4 rows - rectangle)
 * Assets from /assets/characters/
 */

import { ASSETS } from "./assets";

const BASE = ASSETS.characters.base;

// Body: skin tones (Light, Tan, Brown, Default)
export const BODIES = [
  { id: "body_1", file: "MV_Body_1.png", label: "Light" },
  { id: "body_2", file: "MV_Body_2.png", label: "Tan" },
  { id: "body_3", file: "MV_Body_3.png", label: "Brown" },
  { id: "body_4", file: "MV_Body_4.png", label: "Default" },
];

export const OUTFITS = Array.from({ length: 35 }, (_, i) => ({
  id: `outfit_${i + 1}`,
  file: `MV_Outfit_${i + 1}.png`,
  label: `Outfit ${i + 1}`,
}));

export const EYES = Array.from({ length: 6 }, (_, i) => ({
  id: `eyes_${i + 1}`,
  file: `MV_Eyes_${i + 1}.png`,
  label: `Face ${i + 1}`,
}));

export const HAIRSTYLES = Array.from({ length: 182 }, (_, i) => ({
  id: `hair_${i + 1}`,
  file: `MV_Hairstyles_${i + 1}.png`,
  label: `Hair ${i + 1}`,
}));

export function getCharacterUrl(category: "bodies" | "outfits" | "eyes" | "hairstyles", file: string): string {
  return `${BASE}/${category}/${encodeURIComponent(file)}`;
}

export interface CharacterAppearance {
  body: string;
  outfit: string;
  hair: string;
  eyes: string;
}

export const DEFAULT_CHARACTER: CharacterAppearance = {
  body: "body_4",
  outfit: "outfit_1",
  hair: "hair_1",
  eyes: "eyes_1",
};

export function getCharacterFiles(appearance: CharacterAppearance): { body: string; outfit: string; hair: string; eyes: string } {
  const bodyFile = BODIES.find((b) => b.id === appearance.body)?.file ?? BODIES[3].file;
  const outfitFile = OUTFITS.find((o) => o.id === appearance.outfit)?.file ?? OUTFITS[0].file;
  const hairFile = HAIRSTYLES.find((h) => h.id === appearance.hair)?.file ?? HAIRSTYLES[0].file;
  const eyesFile = EYES.find((e) => e.id === appearance.eyes)?.file ?? EYES[0].file;
  return {
    body: getCharacterUrl("bodies", bodyFile),
    outfit: getCharacterUrl("outfits", outfitFile),
    hair: getCharacterUrl("hairstyles", hairFile),
    eyes: getCharacterUrl("eyes", eyesFile),
  };
}
