export type TabKey =
  | "body"
  | "outfit"
  | "accessories"
  | "canvas"
  | "background";

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

export interface ClosetItem {
  id: string;
  name: string;
  occupation?: string;
  type?: ClosetItemType;
  size: number;
  offsetY: number;
  src: string;
  gender?: Gender | "unisex";
  tab: TabKey;
}

export interface PlacedItem extends ClosetItem {
  instanceId: string;
  x: number;
  y: number;
  z: number;
}
