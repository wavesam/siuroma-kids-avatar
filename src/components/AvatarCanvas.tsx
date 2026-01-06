// ==========================================
// FILE 2: AvatarCanvas.tsx
// ==========================================
import React from "react";
import type { PlacedItem, Gender, TabKey } from "../types";
import boyAvatar from "../assets/boy body.png";

const girlAvatar = "https://example.com/images/default_avatar.png";

function AvatarImage({
  gender,
  width,
  height,
}: {
  gender: Gender;
  width: number;
  height: number;
}) {
  const src =
    gender === "male"
      ? boyAvatar
      : typeof girlAvatar === "string"
      ? girlAvatar
      : "https://placehold.co/380x520/png?text=Girl+Avatar";

  return (
    <img
      src={src}
      alt={`${gender} avatar`}
      className="avatarSvg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        scale: 0.7,
        objectFit: "contain",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

export function AvatarCanvas({
  gender,
  tab,
  width = 200,
  height = 300,
  placed,
  freelyDraggable = false,
  setPlaced,
  setDraggingPlacedId,
  setIsHoveringTrash,
  isHoveringTrash,
  removePlacedByInstanceId,
  placeClosetItem,
  snapItems,
}: {
  gender: Gender;
  tab: TabKey;
  width?: number;
  height?: number;
  placed: PlacedItem[];
  freelyDraggable?: boolean;
  setPlaced?: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  setDraggingPlacedId?: (iid: string | null) => void;
  setIsHoveringTrash?: (b: boolean) => void;
  isHoveringTrash?: boolean;
  removePlacedByInstanceId?: (iid: string) => void;
  placeClosetItem?: (
    closetId: string,
    tab: TabKey,
    dropX?: number,
    dropY?: number
  ) => void;
  snapItems?: boolean;
}) {
  const [dragPlacing, setDragPlacing] = React.useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const dragPlacingRef = React.useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const avatarStageRef = React.useRef<HTMLDivElement | null>(null);

  const onMouseDown = (
    id: string,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!freelyDraggable) return;
    if (!setDraggingPlacedId) return;

    setDraggingPlacedId(id);

    const stageRect = avatarStageRef.current?.getBoundingClientRect();
    const item = placed.find((it) => it.instanceId === id);
    if (!item || !stageRect) return;

    console.log("🖱️ [Mouse Drag Start] 拖动已放置的物品:", {
      instanceId: id,
      closetId: item.id,
      name: item.name,
      type: item.type,
      position: { x: item.x, y: item.y },
    });

    const dragInfo = {
      id,
      offsetX: e.clientX - (stageRect.left + item.x),
      offsetY: e.clientY - (stageRect.top + item.y),
    };
    
    // Update both state and ref immediately
    dragPlacingRef.current = dragInfo;
    setDragPlacing(dragInfo);

    document.body.style.cursor = "grabbing";
    e.stopPropagation();
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!dragPlacing) return;

    function onMouseMove(e: MouseEvent) {
      if (!setPlaced || !avatarStageRef.current || !dragPlacing) return;
      const stageRect = avatarStageRef.current.getBoundingClientRect();
      const newX = e.clientX - stageRect.left - dragPlacing.offsetX;
      const newY = e.clientY - stageRect.top - dragPlacing.offsetY;

      setPlaced((current) =>
        current.map((item) =>
          item.instanceId === dragPlacing.id
            ? { ...item, x: newX, y: newY }
            : item
        )
      );

      // Highlight trash while dragging
      if (setIsHoveringTrash) {
        const trash = document.querySelector(".trashCan") as HTMLElement | null;
        if (trash) {
          const rect = trash.getBoundingClientRect();
          setIsHoveringTrash(
            e.clientX >= rect.left &&
              e.clientX <= rect.right &&
              e.clientY >= rect.top &&
              e.clientY <= rect.bottom
          );
        }
      }
    }

    function onMouseUp() {
      // If mouse-drag ended while hovering trash, delete the item.
      if (isHoveringTrash && removePlacedByInstanceId && dragPlacingRef.current) {
        removePlacedByInstanceId(dragPlacingRef.current.id);
      }

      if (setDraggingPlacedId) setDraggingPlacedId(null);
      dragPlacingRef.current = null;
      setDragPlacing(null);
      document.body.style.cursor = "";
      if (setIsHoveringTrash) setIsHoveringTrash(false);
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
  ]);

  // Add a ref to track if we're processing a drop to prevent duplicate calls
  const isProcessingDropRef = React.useRef(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Prevent duplicate drop handling
    if (isProcessingDropRef.current) {
      console.log("❌ [handleDrop] 阻止：正在处理另一个 drop 事件");
      return;
    }

    // FIXED: Removed e.stopPropagation() so the event bubbles to the document listener
    // This allows the global "drop" listener in AvatarStudio to fire and clear the ghost/preview.

    console.log("📦 [handleDrop] Drop 事件触发", {
      dragPlacingRef: dragPlacingRef.current,
      dataTransferTypes: Array.from(e.dataTransfer.types),
      freelyDraggable,
      timestamp: performance.now(),
    });

    // Prevent drop if we're currently dragging a placed item (mouse drag, not HTML5 drag)
    // Use ref for immediate check since state updates are async
    if (dragPlacingRef.current) {
      console.log("❌ [handleDrop] 阻止：正在鼠标拖拽已放置物品", dragPlacingRef.current);
      return;
    }

    if (!placeClosetItem) return;

    // Only accept drops from the closet (HTML5 drag), not from placed items
    // Check if the dropped item is already placed on the canvas
    const id =
      e.dataTransfer.getData("application/x-avatar-item-id") ||
      e.dataTransfer.getData("text/plain");
    
    console.log("📦 [handleDrop] 获取到的 ID:", id);

    if (!id) {
      console.log("❌ [handleDrop] 没有 ID，返回");
      return;
    }

    // CRITICAL: If this is a freelyDraggable tab, check if the item is already placed
    // This prevents creating duplicates when dragging placed items triggers HTML5 drag
    // We check by closetId (item.id) to catch all instances of the same item
    if (freelyDraggable) {
      const isAlreadyPlaced = placed.some((item) => item.id === id);
      if (isAlreadyPlaced) {
        console.log("❌ [handleDrop] 阻止：物品已在画布上", {
          id,
          placedItems: placed.filter((item) => item.id === id).map((item) => ({
            instanceId: item.instanceId,
            name: item.name,
          })),
        });
        // This drop is likely from dragging an already placed item, ignore it
        return;
      }
    }

    // Additional safety check: if dataTransfer doesn't have the expected format,
    // it might be from an unexpected source (like dragging a placed item)
    // Only accept drops that have the proper MIME type from the closet
    const hasClosetMimeType = e.dataTransfer.types.includes("application/x-avatar-item-id");
    if (!hasClosetMimeType && e.dataTransfer.getData("text/plain")) {
      // If it only has text/plain but not the custom MIME type, it might be from a placed item
      // Check if this item is already on the canvas
      const textId = e.dataTransfer.getData("text/plain");
      if (placed.some((item) => item.id === textId)) {
        console.log("❌ [handleDrop] 阻止：只有 text/plain 且物品已在画布上", textId);
        return;
      }
    }

    const rect = avatarStageRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mark as processing to prevent duplicate calls
    isProcessingDropRef.current = true;
    
    // If snapItems is true, don't pass coordinates - let placeClosetItem use SNAP_POSITIONS
    // If snapItems is false, pass the drop coordinates for free placement
    if (snapItems) {
      console.log("✅ [handleDrop] 允许放置（snap模式），调用 placeClosetItem（不传坐标）", {
        id,
        tab,
        snapItems,
      });
      placeClosetItem(id, tab);
    } else {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log("✅ [handleDrop] 允许放置（自由模式），调用 placeClosetItem", {
        id,
        position: { x, y },
        tab,
        snapItems,
      });
      placeClosetItem(id, tab, x, y);
    }

    // Use setTimeout to reset the flag after a short delay
    // This prevents rapid duplicate calls while still allowing legitimate drops
    setTimeout(() => {
      isProcessingDropRef.current = false;
    }, 100);
  };

  return (
    <div
      className="avatarCanvas"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "visible",
        touchAction: "none",
        zIndex: 100,
      }}
    >
      <div
        className="avatarStage"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: "auto",
          zIndex: 200,
        }}
        ref={avatarStageRef}
        onDragOver={(e) => {
          // Prevent drag over if we're currently dragging a placed item (mouse drag)
          // Use ref for immediate check since state updates are async
          if (dragPlacingRef.current) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "none";
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={handleDrop}
      >
        <AvatarImage gender={gender} width={width} height={height} />

        {placed.map((item) => (
          <div
            key={item.instanceId}
            className="placedItem"
            draggable={false}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              width: `${item.w}px`,
              height: `${item.h}px`,
              zIndex: item.z ?? 1,
              position: "absolute",
              cursor: freelyDraggable ? "grab" : undefined,
              pointerEvents: freelyDraggable ? "auto" : "none",
            }}
            onMouseDown={
              freelyDraggable
                ? (e) => {
                    onMouseDown(item.instanceId, e);
                  }
                : undefined
            }
            onDragStart={(e) => {
              // CRITICAL: Prevent HTML5 drag when using mouse drag for placed items
              // If we're in freelyDraggable mode, we use mouse events, not HTML5 drag
              // Also check ref to see if we're already dragging
              if (freelyDraggable || dragPlacingRef.current) {
                const currentItem = placed.find((it) => it.instanceId === item.instanceId);
                console.log("🚫 [onDragStart] 阻止 HTML5 拖拽已放置物品", {
                  freelyDraggable,
                  dragPlacingRef: dragPlacingRef.current,
                  item: currentItem ? { id: currentItem.id, name: currentItem.name } : null,
                });
                e.preventDefault();
                e.stopPropagation();
                // Clear any data that might have been set
                e.dataTransfer.clearData();
                e.dataTransfer.effectAllowed = "none";
                return false;
              }
            }}
          >
            <img
              src={item.src}
              alt={item.name}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
