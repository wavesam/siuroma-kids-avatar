// ------------------------------------------------------------------
// Core Domain Types
// ------------------------------------------------------------------

/**
 * The high-level UI tabs available in the studio.
 * Used for grouping items in the closet panel.
 */
export type TabKey =
  | "body"
  | "outfit"
  | "accessories"
  | "canvas"
  | "background";

/**
 * Gender filtering options for closet items.
 */
export type Gender = "male" | "female";

/**
 * The functional "slot" or type of an item.
 * This determines snapping behavior, layering order, and mutual exclusivity
 * (e.g., you can usually only have one "hair" item at a time if snapping is on).
 */
export type ClosetItemType =
  | "body"
  | "hair"
  | "eyes"
  | "hat"
  | "glasses"
  | "shirt"
  | "jacket"
  | "trousers"
  | "pants"
  | "shoes"
  | "accessory";

/**
 * Represents a raw item available in the closet.
 *
 * Note: `size` and positioning logic are NOT stored here.
 * They are derived from the `type` via `SNAP_CONFIG` in `closetData.ts`.
 */
export interface ClosetItem {
  id: string;
  name: string;
  /** The functional slot this item belongs to (determines snap behavior). */
  type?: ClosetItemType;
  /** The source URL or import for the image asset. */
  src: string;
  /** Optional gender restriction for filtering. */
  gender?: Gender | "unisex";
  /** The UI tab this item appears in. */
  tab: TabKey;
  /** Optional hex code or color value (mostly for background items). */
  color?: string;
}

/**
 * Helper type for defining items in separate data files (e.g., `bodyClosetData.ts`).
 * These files don't need to repeat the `tab` property since it's assigned during aggregation.
 */
export type ClosetItemDefinition = Omit<ClosetItem, "tab">;

/**
 * Represents an item that has been dragged onto the canvas.
 * Includes unique instance data and resolved spatial coordinates.
 */
export interface PlacedItem extends ClosetItem {
  /** Unique ID for this specific instance on the canvas (allows duplicates of the same closet item). */
  instanceId: string;
  /** X coordinate on the canvas. */
  x: number;
  /** Y coordinate on the canvas. */
  y: number;
  /** Z-index (layering order). */
  z: number;
  /**
   * The resolved size in pixels.
   * This is calculated at runtime based on the `type` config or canvas size.
   */
  size: number;
  /** Optional color override. */
  color?: string;
}
