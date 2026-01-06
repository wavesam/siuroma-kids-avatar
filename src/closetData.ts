import type { ClosetItem, ClosetItemType } from "./types";
import boyHair1 from "./assets/boy hair 1.png";
import boyHair2 from "./assets/boy hair 2.png";

// List of all closet items
export const CLOSET: ClosetItem[] = [
  {
    id: "boyHair1",
    name: "Boy Hair Style 1",
    occupation: "fashion",
    type: "hair",
    w: 220,
    h: 150,
    src: boyHair1,
    gender: "male",
  },
  {
    id: "boyHair2",
    name: "Boy Hair Style 2",
    occupation: "fashion",
    type: "hair",
    w: 220,
    h: 150,
    src: boyHair2,
    gender: "male",
  },
  // Add more items as needed...
];

// Snap positions for different types
export const SNAP_POSITIONS: Record<ClosetItemType, { x: number; y: number }> =
  {
    hair: { x: 0.5, y: 0.08 },
    hat: { x: 0.5, y: 0.05 },
    glasses: { x: 0.5, y: 0.22 },
    shirt: { x: 0.5, y: 0.4 },
    jacket: { x: 0.5, y: 0.38 },
    trousers: { x: 0.5, y: 0.6 },
    pants: { x: 0.5, y: 0.6 },
    shoes: { x: 0.5, y: 0.88 },
    accessory: { x: 0.5, y: 0.5 },
  };
