// TabKey is required for ClosetItem.tab
export type TabKey = "body" | "outfit" | "accessories" | "canvas" | "background";

export type Gender = "male" | "female";

export type ClosetItemType =
  | "body"
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
  type?: ClosetItemType; // For item category, e.g. "body", "shirt", etc

  w: number;
  h: number;
  src: string;

  // restrict to specific gender, or allow both with "unisex"
  gender?: Gender | "unisex";

  tab: TabKey; // <-- Tab assignment for item
}

export interface PlacedItem extends ClosetItem {
  instanceId: string;
  x: number;
  y: number;
  z: number;
}
