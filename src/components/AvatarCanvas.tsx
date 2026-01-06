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

    setDragPlacing({
      id,
      offsetX: e.clientX - (stageRect.left + item.x),
      offsetY: e.clientY - (stageRect.top + item.y),
    });

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
      if (isHoveringTrash && removePlacedByInstanceId && dragPlacing) {
        removePlacedByInstanceId(dragPlacing.id);
      }

      if (setDraggingPlacedId) setDraggingPlacedId(null);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // FIXED: Removed e.stopPropagation() so the event bubbles to the document listener
    // This allows the global "drop" listener in AvatarStudio to fire and clear the ghost/preview.

    if (!placeClosetItem) return;

    const id =
      e.dataTransfer.getData("application/x-avatar-item-id") ||
      e.dataTransfer.getData("text/plain");
    if (!id) return;

    const rect = avatarStageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    placeClosetItem(id, tab, x, y);
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
                ? (e) => onMouseDown(item.instanceId, e)
                : undefined
            }
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
