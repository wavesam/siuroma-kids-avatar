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
  type?: ClosetItemType;
  /** Optional grouping for careers/roles (overrides type in filter UI if present) */
  occupation?: string;
  src: string;
  gender?: Gender | "unisex";
  tab: TabKey;
  color?: string;
  /** Whether this item should snap to fixed positions (true) or be freely draggable (false) */
  snapItems?: boolean;
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
