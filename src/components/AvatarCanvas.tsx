import React from "react";
import type { PlacedItem, Gender, TabKey } from "../types";
import { usePlacedItemDrag } from "../hooks/usePlacedItemDrag";
import { DRAWING_LAYER_ID, AVATAR_DISPLAY_SIZE } from "../constants";
import boyAvatar from "../assets/boys only/body/boy body.png";
import girlAvatar from "../assets/girls only/body/girl body.png";

type PlacedWithNorm = PlacedItem & {
  xNorm?: number;
  yNorm?: number;
  sizeNorm?: number;
  color?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  src?: string;
};

function AvatarImage({
  gender,
  size,
  offsetY,
}: {
  gender: Gender;
  size: number;
  offsetY: number;
}) {
  const src = gender === "male" ? boyAvatar : girlAvatar;

  return (
    <img
      src={src}
      alt={`${gender} avatar`}
      className="avatarSvg"
      style={{
        width: `${size}px`,
        height: "auto",
        transform: offsetY ? `translateY(${offsetY}px)` : undefined,
        objectFit: "contain",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

interface AvatarCanvasProps {
  gender: Gender;
  tab: TabKey;
  size?: number;
  offsetY?: number;
  placed: PlacedItem[];
  setPlaced?: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  setDraggingPlacedId?: (id: string | null) => void;
  setIsHoveringTrash?: (b: boolean) => void;
  isHoveringTrash?: boolean;
  removePlacedByInstanceId?: (id: string) => void;
  placeClosetItem?: (
    closetId: string,
    tab: TabKey,
    dropX?: number,
    dropY?: number
  ) => void;
  snapItems?: boolean;
}

export function AvatarCanvas({
  gender,
  tab,
  size = AVATAR_DISPLAY_SIZE,
  offsetY = 0,
  placed,
  setPlaced,
  setDraggingPlacedId,
  setIsHoveringTrash,
  isHoveringTrash,
  removePlacedByInstanceId,
  placeClosetItem,
  snapItems,
}: AvatarCanvasProps) {
  const [stageSize, setStageSize] = React.useState({ width: size, height: size });
  const avatarStageRef = React.useRef<HTMLDivElement | null>(null);
  const avatarCanvasRef = React.useRef<HTMLDivElement | null>(null);
  const isProcessingDropRef = React.useRef(false);

  const getStageRect = React.useCallback(
    () => avatarStageRef.current?.getBoundingClientRect() ?? null,
    []
  );

  // Use the extracted drag hook
  const { dragPlacingRef, onMouseDown } = usePlacedItemDrag({
    placed,
    setPlaced,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
    snapItems,
    getStageRect,
  });

  // Extract background item
  const backgroundItem = [...placed]
    .filter((p) => p.tab === "background")
    .pop() as PlacedWithNorm | undefined;

  const background = backgroundItem?.color;
  const backgroundImage = backgroundItem?.src
    ? `url("${backgroundItem.src}")`
    : undefined;
  const backgroundSize =
    backgroundItem?.backgroundSize ?? (backgroundImage ? "cover" : "auto");
  const backgroundRepeat =
    backgroundItem?.backgroundRepeat ??
    (backgroundImage ? "no-repeat" : backgroundSize ? "repeat" : "no-repeat");

  const drawingLayer = placed.find((p) => p.id === DRAWING_LAYER_ID) as
    | PlacedWithNorm
    | undefined;

  // Track stage size for rendering
  React.useLayoutEffect(() => {
    const el = avatarStageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();

    if (isProcessingDropRef.current || dragPlacingRef.current || !placeClosetItem) return;

    const id =
      e.dataTransfer.getData("application/x-avatar-item-id") ||
      e.dataTransfer.getData("text/plain");
    if (!id) return;

    // For snap items, allow replacement; for free items, prevent duplicates
    if (!snapItems && placed.some((item) => item.id === id)) return;

    const stageRect = getStageRect();
    const canvasRect = avatarCanvasRef.current?.getBoundingClientRect();
    if (!stageRect || !canvasRect) return;

    const isOverCanvas =
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom;
    if (!isOverCanvas) return;

    isProcessingDropRef.current = true;

    if (snapItems) {
      placeClosetItem(id, tab);
    } else {
      const x = e.clientX - stageRect.left;
      const y = e.clientY - stageRect.top;
      placeClosetItem(id, tab, x, y);
    }

    setTimeout(() => {
      isProcessingDropRef.current = false;
    }, 100);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (dragPlacingRef.current) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const backgroundStyle =
    backgroundImage || background != null
      ? {
          background: backgroundImage || background,
          backgroundSize: backgroundSize ?? "auto",
          backgroundRepeat: backgroundRepeat,
          backgroundPosition: backgroundImage ? "center" : undefined,
        }
      : { background: "transparent" as const };

  return (
    <div
      className="avatarCanvas"
      ref={avatarCanvasRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "visible",
        touchAction: "none",
        zIndex: 100,
        ...backgroundStyle,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {drawingLayer?.src && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 350,
            pointerEvents: "none",
            backgroundImage: `url("${drawingLayer.src}")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 0",
            backgroundSize: "100% 100%",
          }}
        />
      )}

      <div
        className="avatarStage"
        ref={avatarStageRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${offsetY}px)`,
          width: `${size}px`,
          height: "auto",
          pointerEvents: "auto",
          zIndex: 200,
          background: "transparent",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <AvatarImage gender={gender} size={size} offsetY={0} />

        {placed.map((raw) => {
          const item = raw as PlacedWithNorm;
          if (item.id === DRAWING_LAYER_ID || item.tab === "background") return null;

          const stageW = stageSize.width || size;
          const stageH = stageSize.height || size;

          const sizeNorm = item.sizeNorm ?? (item.size ? item.size / stageW : 0);
          const xNorm = item.xNorm ?? (item.x ?? 0) / stageW;
          const yNorm = item.yNorm ?? (item.y ?? 0) / stageH;

          const renderW = sizeNorm * stageW;
          const left = xNorm * stageW;
          const top = yNorm * stageH;

          const tabSnapItems = snapItems ?? false;
          const itemSnapItems = item.snapItems ?? false;
          const isItemDraggable = !tabSnapItems && !itemSnapItems;

          return (
            <div
              key={item.instanceId}
              className="placedItem"
              draggable={false}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${renderW}px`,
                height: `${renderW}px`,
                zIndex: item.z ?? 1,
                position: "absolute",
                cursor: isItemDraggable ? "grab" : undefined,
                pointerEvents: isItemDraggable ? "auto" : "none",
              }}
              onMouseDown={isItemDraggable ? (e) => onMouseDown(item.instanceId, e) : undefined}
              onDragStart={(e) => {
                if (isItemDraggable || dragPlacingRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.clearData();
                  e.dataTransfer.effectAllowed = "none";
                  return false;
                }
              }}
            >
              {item.src && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url("${item.src}")`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
