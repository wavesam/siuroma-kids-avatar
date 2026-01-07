import type {
  ClosetItemType,
  TabKey,
  ClosetItem,
  ClosetItemDefinition,
} from "./types";
import { bodyClosetData } from "./data/bodyClosetData";
import { outfitClosetData } from "./data/outfitClosetData";
import { accessoriesClosetData } from "./data/accessoriesClosetData";
import { canvasClosetData } from "./data/canvasClosetData";
import { backgroundClosetData } from "./data/backgroundClosetData";

// Single config for snap anchor + default size per type
export const SNAP_CONFIG: Record<
  ClosetItemType,
  { x: number; y: number; size: number }
> = {
  hair: { x: 0.5, y: 0.34, size: 320 },
  eyes: { x: 0.5, y: 0.3, size: 170 },
  hat: { x: 0.5, y: 0.05, size: 100 },
  glasses: { x: 0.5, y: 0.22, size: 100 },
  shirt: { x: 0.5, y: 0.4, size: 100 },
  jacket: { x: 0.5, y: 0.38, size: 100 },
  trousers: { x: 0.5, y: 0.6, size: 100 },
  pants: { x: 0.5, y: 0.6, size: 100 },
  shoes: { x: 0.5, y: 0.88, size: 100 },
  accessory: { x: 0.5, y: 0.5, size: 100 },
  body: { x: 0, y: 0, size: 100 },
};

function withTab(items: ClosetItemDefinition[], tab: TabKey): ClosetItem[] {
  return items.map((item) => ({ ...item, tab }));
}

export const CLOSET_DATA_BY_TAB: Record<TabKey, ClosetItem[]> = {
  body: withTab(bodyClosetData, "body"),
  // If these files still include `tab`, either update them to ClosetItemDefinition[] too,
  // or keep the cast until you migrate them.
  outfit: withTab(outfitClosetData as any, "outfit"),
  accessories: withTab(accessoriesClosetData as any, "accessories"),
  canvas: withTab(canvasClosetData as any, "canvas"),
  background: withTab(backgroundClosetData as any, "background"),
};

export const CLOSET = Object.values(CLOSET_DATA_BY_TAB).flat();
