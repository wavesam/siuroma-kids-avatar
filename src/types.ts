export type Gender = "male" | "female";

export type ClosetItemType =
  | "hair"
  | "hat"
  | "glasses"
  | "shirt"
  | "jacket"
  | "trousers"
  | "pants"
  | "shoes"
  | "accessory";

// Add 'gender' property! Use 'unisex', 'male', or 'female'
export interface ClosetItem {
  id: string;
  name: string;
  occupation?: string;

  // Used for snapping (hair/trousers/etc)
  type?: ClosetItemType;

  w: number;
  h: number;
  src: string;

  // NEW: restrict to specific gender, or allow both with "unisex"
  gender?: Gender | "unisex";
}

export interface PlacedItem extends ClosetItem {
  instanceId: string;
  x: number;
  y: number;
  z: number;
}
