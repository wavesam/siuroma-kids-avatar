import { useState, useRef, useEffect, useCallback } from "react";
import type { PlacedItem } from "../types";

type PlacedWithNorm = PlacedItem & {
  xNorm?: number;
  yNorm?: number;
  sizeNorm?: number;
  snapItems?: boolean;
};

interface UsePlacedItemDragOptions {
  placed: PlacedItem[];
  setPlaced?: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  setDraggingPlacedId?: (id: string | null) => void;
  setIsHoveringTrash?: (b: boolean) => void;
  isHoveringTrash?: boolean;
  removePlacedByInstanceId?: (id: string) => void;
  snapItems?: boolean;
  getStageRect: () => DOMRect | null;
}

interface DragInfo {
  id: string;
  offsetXRatio: number;
  offsetYRatio: number;
}

export function usePlacedItemDrag(options: UsePlacedItemDragOptions) {
  const {
    placed,
    setPlaced,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
    snapItems,
    getStageRect,
  } = options;

  const [dragPlacing, setDragPlacing] = useState<DragInfo | null>(null);
  const dragPlacingRef = useRef<DragInfo | null>(null);

  const onMouseDown = useCallback(
    (id: string, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!setDraggingPlacedId) return;
      
      const rect = getStageRect();
      if (!rect) return;

      const item = placed.find((it) => it.instanceId === id) as PlacedWithNorm | undefined;
      if (!item) return;

      // Check both tab-level and item-level snapItems
      const tabSnapItems = snapItems ?? false;
      const itemSnapItems = item.snapItems ?? false;
      if (tabSnapItems || itemSnapItems) return;

      const xNorm = item.xNorm ?? item.x / rect.width;
      const yNorm = item.yNorm ?? item.y / rect.height;

      const renderX = xNorm * rect.width;
      const renderY = yNorm * rect.height;

      const offsetXRatio = (e.clientX - (rect.left + renderX)) / rect.width;
      const offsetYRatio = (e.clientY - (rect.top + renderY)) / rect.height;

      const dragInfo = { id, offsetXRatio, offsetYRatio };
      dragPlacingRef.current = dragInfo;
      setDragPlacing(dragInfo);
      setDraggingPlacedId(id);

      document.body.style.cursor = "grabbing";
      e.stopPropagation();
      e.preventDefault();
    },
    [placed, setDraggingPlacedId, snapItems, getStageRect]
  );

  useEffect(() => {
    if (!dragPlacing) return;

    function onMouseMove(e: MouseEvent) {
      if (!setPlaced || !dragPlacing) return;
      
      const rect = getStageRect();
      if (!rect) return;

      const pointerXRatio = (e.clientX - rect.left) / rect.width;
      const pointerYRatio = (e.clientY - rect.top) / rect.height;

      const newXNorm = pointerXRatio - dragPlacing.offsetXRatio;
      const newYNorm = pointerYRatio - dragPlacing.offsetYRatio;

      setPlaced((current) =>
        current.map((raw) => {
          if (raw.instanceId !== dragPlacing.id) return raw;
          const item = raw as PlacedWithNorm;
          const sizeNorm = item.sizeNorm ?? (item.size ? item.size / rect.width : 0);

          return {
            ...item,
            xNorm: newXNorm,
            yNorm: newYNorm,
            sizeNorm,
            x: newXNorm * rect.width,
            y: newYNorm * rect.height,
            size: sizeNorm * rect.width,
          };
        })
      );

      if (setIsHoveringTrash) {
        const trash = document.querySelector(".trashCan") as HTMLElement | null;
        if (trash) {
          const tRect = trash.getBoundingClientRect();
          setIsHoveringTrash(
            e.clientX >= tRect.left &&
            e.clientX <= tRect.right &&
            e.clientY >= tRect.top &&
            e.clientY <= tRect.bottom
          );
        }
      }
    }

    function onMouseUp() {
      if (isHoveringTrash && removePlacedByInstanceId && dragPlacingRef.current) {
        removePlacedByInstanceId(dragPlacingRef.current.id);
      }

      setDraggingPlacedId?.(null);
      dragPlacingRef.current = null;
      setDragPlacing(null);
      document.body.style.cursor = "";
      setIsHoveringTrash?.(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    dragPlacing,
    setPlaced,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
    getStageRect,
  ]);

  return {
    dragPlacing,
    dragPlacingRef,
    onMouseDown,
  };
}
