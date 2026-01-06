// ==========================================
// FILE 1: AvatarStudio.tsx
// ==========================================
import React, { type JSX } from "react";
import type {
  ClosetItem,
  Gender,
  PlacedItem,
  TabKey,
  ClosetItemType,
} from "../types";
import { CLOSET, SNAP_POSITIONS } from "../closetData";
import { OutfitTab } from "./OutfitTab";
import { BodyTab } from "./BodyTab";
import { AccessoriesTab } from "./AccessoriesTab";
import { CanvasTab } from "./CanvasTab";
import { BackgroundTab } from "./BackgroundTab";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const TABS: { key: TabKey; label: string; number: number }[] = [
  { key: "body", label: "Body", number: 1 },
  { key: "outfit", label: "Outfit", number: 2 },
  { key: "accessories", label: "Accessories", number: 3 },
  { key: "canvas", label: "Canvas", number: 4 },
  { key: "background", label: "Background", number: 5 },
];

const TAB_BEHAVIORS: Record<TabKey, { snapItems: boolean }> = {
  body: { snapItems: false },
  outfit: { snapItems: true },
  accessories: { snapItems: true },
  canvas: { snapItems: false },
  background: { snapItems: false },
};

export function AvatarStudio() {
  const [gender, setGender] = React.useState<Gender>("male");
  const [tab, setTab] = React.useState<TabKey>("body");
  const [placed, setPlaced] = React.useState<PlacedItem[]>([]);
  const [topZ, setTopZ] = React.useState(1);

  const [draggingClosetId, setDraggingClosetId] = React.useState<string | null>(
    null
  );
  const [dragPos, setDragPos] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const draggingClosetIdRef = React.useRef<string | null>(null);

  const [isHoveringTrash, setIsHoveringTrash] = React.useState(false);
  const [draggingPlacedId, setDraggingPlacedId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    draggingClosetIdRef.current = draggingClosetId;
  }, [draggingClosetId]);

  // Dedupe drops
  const lastDropRef = React.useRef<{ key: string; t: number } | null>(null);
  const shouldAcceptDrop = (key: string) => {
    const now = performance.now();
    const last = lastDropRef.current;
    if (last && last.key === key && now - last.t < 500) {
      console.log("❌ [shouldAcceptDrop] 阻止重复放置", {
        key,
        timeSinceLast: now - last.t,
        lastTime: last.t,
        currentTime: now,
      });
      return false;
    }
    lastDropRef.current = { key, t: now };
    console.log("✅ [shouldAcceptDrop] 允许放置", { key, time: now });
    return true;
  };

  React.useEffect(() => {
    const onDocDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!draggingClosetIdRef.current) return;
      if (e.clientX === 0 && e.clientY === 0) return;
      setDragPos({ x: e.clientX, y: e.clientY });
    };
    const clear = () => {
      setDraggingClosetId(null);
      setDragPos(null);
      setIsHoveringTrash(false);
    };
    document.addEventListener("dragover", onDocDragOver);
    document.addEventListener("dragend", clear);
    document.addEventListener("drop", clear);
    return () => {
      document.removeEventListener("dragover", onDocDragOver);
      document.removeEventListener("dragend", clear);
      document.removeEventListener("drop", clear);
    };
  }, []);

  const { snapItems } = TAB_BEHAVIORS[tab];
  const replaceSameType = snapItems;
  const showTrash = !snapItems;

  // Add a ref to prevent duplicate execution of placeClosetItem
  const isPlacingItemRef = React.useRef(false);

  const placeClosetItem = (
    closetId: string,
    targetTab: TabKey,
    dropX?: number,
    dropY?: number
  ) => {
    // Prevent duplicate execution
    if (isPlacingItemRef.current) {
      console.log("❌ [placeClosetItem] 阻止：正在处理另一个放置操作");
      return;
    }

    const item = CLOSET.find((c) => c.id === closetId && c.tab === targetTab);
    if (!item) {
      console.log("❌ [placeClosetItem] 未找到物品", { closetId, targetTab });
      return;
    }

    const rx = typeof dropX === "number" ? Math.round(dropX) : -1;
    const ry = typeof dropY === "number" ? Math.round(dropY) : -1;
    const dedupeKey = `${targetTab}:${closetId}:${
      snapItems ? "snap" : "free"
    }:${rx},${ry}`;
    if (!shouldAcceptDrop(dedupeKey)) {
      console.log("❌ [placeClosetItem] 重复放置被阻止", { dedupeKey });
      return;
    }

    // Mark as processing
    isPlacingItemRef.current = true;

    let x: number, y: number;
    if (!snapItems && typeof dropX === "number" && typeof dropY === "number") {
      x = dropX - item.w / 2;
      y = dropY - item.h / 2;
    } else {
      const snapConfig = SNAP_POSITIONS[item.type as ClosetItemType] ?? {
        x: 0.5,
        y: 0.5,
      };
      x = snapConfig.x * CANVAS_WIDTH - item.w / 2;
      y = snapConfig.y * CANVAS_HEIGHT - item.h / 2;
    }

    console.log("✅ [placeClosetItem] 放置物品到画布", {
      closetId,
      name: item.name,
      type: item.type,
      position: { x, y },
      snapItems,
      targetTab,
    });

    // Use a single state update instead of nested updates
    // This prevents React from calling the callback multiple times
    setTopZ((z) => {
      const newZ = z + 1;
      setPlaced((current) => {
        // Double-check inside the callback to prevent duplicate additions
        const existingInstance = current.find(
          (p) => p.id === closetId && Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
        );
        if (existingInstance) {
          console.log("❌ [placeClosetItem setPlaced] 阻止：相同位置已有实例", {
            existingInstance: existingInstance.instanceId,
            newPosition: { x, y },
          });
          isPlacingItemRef.current = false;
          return current;
        }

        let filtered = current;
        if (replaceSameType) {
          filtered = filtered.filter((p) => p.type !== item.type);
        }
        const newInstanceId = crypto.randomUUID();
        console.log("📝 [placeClosetItem setPlaced] 创建新实例", {
          instanceId: newInstanceId,
          closetId,
          name: item.name,
          totalPlaced: filtered.length + 1,
        });
        
        // Reset the flag after a short delay
        setTimeout(() => {
          isPlacingItemRef.current = false;
        }, 100);
        
        return [
          ...filtered,
          { ...item, instanceId: newInstanceId, x, y, z: newZ },
        ];
      });
      return newZ;
    });
  };

  const removePlacedByInstanceId = (instanceId: string) => {
    setPlaced((current) =>
      current.filter((item) => item.instanceId !== instanceId)
    );
  };

  const removePlacedByClosetId = (closetId: string) => {
    setPlaced((current) => current.filter((item) => item.id !== closetId));
  };

  const filteredCloset = CLOSET.filter((item) => item.tab === tab);

  const previewItem = draggingClosetId
    ? CLOSET.find((c) => c.id === draggingClosetId) ?? null
    : null;

  const sharedTabProps = {
    gender,
    setGender,
    tab,
    placed,
    setPlaced,
    setDraggingClosetId,
    setDragPos,
    draggingClosetId,
    dragPos,
    topZ,
    setTopZ,
    closet: filteredCloset,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    placeClosetItem,
    snapItems,
    showTrash,
    removePlacedByClosetId,
    setIsHoveringTrash,
    isHoveringTrash,
    setDraggingPlacedId,
    draggingPlacedId,
    removePlacedByInstanceId,
  } as const;

  let TabContent: JSX.Element | null = null;
  switch (tab) {
    case "body":
      TabContent = <BodyTab {...sharedTabProps} />;
      break;
    case "outfit":
      TabContent = <OutfitTab {...sharedTabProps} />;
      break;
    case "accessories":
      TabContent = <AccessoriesTab {...sharedTabProps} />;
      break;
    case "canvas":
      TabContent = <CanvasTab {...sharedTabProps} />;
      break;
    case "background":
      TabContent = <BackgroundTab {...sharedTabProps} />;
      break;
    default:
      TabContent = null;
  }

  // FIXED: Removed "|| true" which was forcing trash to always show
  const showTrashCan = showTrash && (draggingClosetId || draggingPlacedId);

  // For HTML5 drops (closet drag) the trash can still works.
  const handleTrashDrop = () => {
    if (draggingPlacedId) {
      removePlacedByInstanceId(draggingPlacedId);
      setDraggingPlacedId(null);
      setIsHoveringTrash(false);
    }
    if (draggingClosetId) {
      removePlacedByClosetId(draggingClosetId);
      setDraggingClosetId(null);
      setDragPos(null);
      setIsHoveringTrash(false);
    }
  };

  return (
    <div className="studio">
      <div className="studioMain">
        <div className="studioTopBar" />
        <div className="studioTabsBar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-selected={tab === t.key}
              className={tab === t.key ? "studioTab tabSelected" : "studioTab"}
              type="button"
            >
              <span className="studioTabNumber">{t.number}</span>
              <span className="studioTabLabel">{t.label}</span>
            </button>
          ))}
        </div>

        {TabContent}

        <DragGhost item={previewItem} pos={dragPos} />

        {showTrashCan && (
          <TrashCan
            visible
            isHover={isHoveringTrash}
            setIsHoveringTrash={setIsHoveringTrash}
            onDrop={handleTrashDrop}
          />
        )}
      </div>
    </div>
  );
}

function DragGhost({
  item,
  pos,
}: {
  item: ClosetItem | null;
  pos: { x: number; y: number } | null;
}) {
  if (!item || !pos) return null;
  return (
    <div
      className="dragGhost"
      style={{
        left: pos.x,
        top: pos.y,
        width: item.w,
        height: item.h,
        position: "fixed",
        pointerEvents: "none",
        zIndex: 99999,
        transform: "translate(-50%, -50%)",
      }}
    >
      <img
        src={item.src}
        alt={item.name}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

function TrashCan({
  visible,
  isHover,
  setIsHoveringTrash,
  onDrop,
}: {
  visible: boolean;
  isHover: boolean;
  setIsHoveringTrash: (b: boolean) => void;
  onDrop: () => void;
}) {
  if (!visible) return null;
  return (
    <div
      className="trashCan"
      style={{
        position: "fixed",
        right: 40,
        bottom: 40,
        width: 90,
        height: 90,
        borderRadius: 16,
        background: isHover ? "#da4848" : "#fff",
        border: "2px solid #333",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        zIndex: 3001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 42,
        color: isHover ? "#fff" : "#333",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsHoveringTrash(true);
      }}
      onDragLeave={() => setIsHoveringTrash(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsHoveringTrash(false);
        onDrop();
      }}
    >
      <span role="img" aria-label="Trash">
        🗑️
      </span>
    </div>
  );
}
