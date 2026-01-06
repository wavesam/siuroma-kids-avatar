import type { ClosetItemType, TabKey, ClosetItem } from "./types";
import { bodyClosetData } from "./data/bodyClosetData";
import { outfitClosetData } from "./data/outfitClosetData";
import { accessoriesClosetData } from "./data/accessoriesClosetData";
import { canvasClosetData } from "./data/canvasClosetData";
import { backgroundClosetData } from "./data/backgroundClosetData";

export const SNAP_POSITIONS: Record<ClosetItemType, { x: number; y: number }> =
  {
    hair: { x: 0, y: 0 },
    hat: { x: 0.5, y: 0.05 },
    glasses: { x: 0.5, y: 0.22 },
    shirt: { x: 0.5, y: 0.4 },
    jacket: { x: 0.5, y: 0.38 },
    trousers: { x: 0.5, y: 0.6 },
    pants: { x: 0.5, y: 0.6 },
    shoes: { x: 0.5, y: 0.88 },
    accessory: { x: 0.5, y: 0.5 },
    // NOTE: x:0, y:0 now resolves to canvas center in AvatarStudio
    body: { x: 0, y: 0 },
  };

// Organized lookup object
export const CLOSET_DATA_BY_TAB: Record<TabKey, ClosetItem[]> = {
  body: bodyClosetData,
  outfit: outfitClosetData,
  accessories: accessoriesClosetData,
  canvas: canvasClosetData,
  background: backgroundClosetData,
};

// Flat array for backwards compatibility
export const CLOSET = Object.values(CLOSET_DATA_BY_TAB).flat();
