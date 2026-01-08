import React from "react";
import type { PlacedItem, Gender, TabKey } from "../types";
import boyAvatar from "../assets/boys only/body/boy body.png";
import girlAvatar from "../assets/girls only/body/girl body.png";

type PlacedWithNorm = PlacedItem & {
  xNorm?: number;
  yNorm?: number;
  sizeNorm?: number;
  color?: string; // CSS background string
  backgroundSize?: string;
  backgroundRepeat?: string;
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
  const src =
    gender === "male"
      ? boyAvatar
      : typeof girlAvatar === "string"
      ? girlAvatar
      : girlAvatar;

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

// All geometry is kept in normalized coordinates (0–1) relative to the stage.
export function AvatarCanvas({
  gender,
  tab,
  size = 200,
  offsetY = 0,
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
  size?: number;
  offsetY?: number;
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
  const [stageSize, setStageSize] = React.useState<{
    width: number;
    height: number;
  }>({
    width: size,
    height: size,
  });

  const avatarStageRef = React.useRef<HTMLDivElement | null>(null);
  const avatarCanvasRef = React.useRef<HTMLDivElement | null>(null);

  // Compute background style from the last placed background item (if any)
  const backgroundItem = [...placed]
    .filter((p) => p.tab === "background")
    .pop() as PlacedWithNorm | undefined;

  const background = backgroundItem?.color;
  const backgroundSize = backgroundItem?.backgroundSize;
  const backgroundRepeat =
    backgroundItem?.backgroundRepeat ??
    (backgroundSize ? "repeat" : "no-repeat");

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

  const getStageRect = () =>
    avatarStageRef.current?.getBoundingClientRect() ?? null;

  const [dragPlacing, setDragPlacing] = React.useState<{
    id: string;
    offsetXRatio: number;
    offsetYRatio: number;
  } | null>(null);

  const dragPlacingRef = React.useRef<{
    id: string;
    offsetXRatio: number;
    offsetYRatio: number;
  } | null>(null);

  const onMouseDown = (
    id: string,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!freelyDraggable || !setDraggingPlacedId) return;
    const rect = getStageRect();
    if (!rect) return;

    const item = placed.find((it) => it.instanceId === id) as
      | PlacedWithNorm
      | undefined;
    if (!item) return;

    const xNorm = item.xNorm ?? item.x / rect.width;
    const yNorm = item.yNorm ?? item.y / rect.height;

    const renderX = xNorm * rect.width;
    const renderY = yNorm * rect.height;

    const offsetXRatio = (e.clientX - (rect.left + renderX)) / rect.width;
    const offsetYRatio = (e.clientY - (rect.top + renderY)) / rect.height;

    const dragInfo = { id, offsetXRatio, offsetYRatio };
    dragPlacingRef.current = dragInfo;
    setDragPlacing(dragInfo);
    setDraggingPlacedId?.(id);

    document.body.style.cursor = "grabbing";
    e.stopPropagation();
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!dragPlacing) return;

    function onMouseMove(e: MouseEvent) {
      if (!setPlaced || !avatarStageRef.current || !dragPlacing) return;
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
          const xNorm = newXNorm;
          const yNorm = newYNorm;
          const sizeNorm =
            item.sizeNorm ?? (item.size ? item.size / rect.width : 0);

          return {
            ...item,
            xNorm,
            yNorm,
            sizeNorm,
            x: xNorm * rect.width,
            y: yNorm * rect.height,
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
      if (
        isHoveringTrash &&
        removePlacedByInstanceId &&
        dragPlacingRef.current
      ) {
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
  ]);

  const isProcessingDropRef = React.useRef(false);

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();

    if (isProcessingDropRef.current) return;
    if (dragPlacingRef.current) return;
    if (!placeClosetItem) return;

    const id =
      e.dataTransfer.getData("application/x-avatar-item-id") ||
      e.dataTransfer.getData("text/plain");

    if (!id) return;

    if (freelyDraggable) {
      const isAlreadyPlaced = placed.some((item) => item.id === id);
      if (isAlreadyPlaced) return;
    }

    const hasClosetMimeType = e.dataTransfer.types.includes(
      "application/x-avatar-item-id"
    );
    if (!hasClosetMimeType && e.dataTransfer.getData("text/plain")) {
      const textId = e.dataTransfer.getData("text/plain");
      if (placed.some((item) => item.id === textId)) return;
    }

    const stageRect = getStageRect();
    const canvasRect = avatarCanvasRef.current?.getBoundingClientRect();
    if (!stageRect || !canvasRect) return;

    const isOverCanvas =
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom;

    if (!isOverCanvas) return;

    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;

    isProcessingDropRef.current = true;

    if (snapItems) {
      placeClosetItem(id, tab);
    } else {
      placeClosetItem(id, tab, x, y);
    }

    setTimeout(() => {
      isProcessingDropRef.current = false;
    }, 100);
  };

  const backgroundStyle =
    background != null
      ? {
          background,
          backgroundSize: backgroundSize ?? "auto",
          backgroundRepeat: backgroundRepeat,
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
      onDragOver={(e) => {
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
      <div
        className="avatarStage"
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
        ref={avatarStageRef}
        onDragOver={(e) => {
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
        <AvatarImage gender={gender} size={size} offsetY={0} />

        {placed.map((raw) => {
          const item = raw as PlacedWithNorm;
          const stageW = stageSize.width || size;
          const stageH = stageSize.height || size;

          const sizeNorm =
            item.sizeNorm ?? (item.size ? item.size / stageW : 0);
          const xNorm = item.xNorm ?? (item.x ?? 0) / stageW;
          const yNorm = item.yNorm ?? (item.y ?? 0) / stageH;

          const renderW = sizeNorm * stageW;
          const renderH = renderW; // square items

          const left = xNorm * stageW;
          const top = yNorm * stageH;

          if (item.tab === "background" && item.color && !item.src) {
            return null;
          }

          return (
            <div
              key={item.instanceId}
              className="placedItem"
              draggable={false}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${renderW}px`,
                height: `${renderH}px`,
                zIndex: item.z ?? 1,
                position: "absolute",
                cursor: freelyDraggable ? "grab" : undefined,
                pointerEvents: freelyDraggable ? "auto" : "none",
                // FIX: Removed flex centering; background-position handles it now.
              }}
              onMouseDown={
                freelyDraggable
                  ? (e) => {
                      onMouseDown(item.instanceId, e);
                    }
                  : undefined
              }
              onDragStart={(e) => {
                if (freelyDraggable || dragPlacingRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.clearData();
                  e.dataTransfer.effectAllowed = "none";
                  return false;
                }
              }}
            >
              {/* FIX: Use div with background-image instead of img tag.
                  This supports 'contain' scaling perfectly in html2canvas for 
                  BOTH landscape (eyes) and portrait (dresses) items. */}
              {item.src ? (
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
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
