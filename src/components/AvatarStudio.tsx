import React, { type JSX } from "react";
import type {
  ClosetItem,
  Gender,
  PlacedItem,
  TabKey,
  ClosetItemType,
} from "../types";
import { CLOSET_DATA_BY_TAB, SNAP_POSITIONS } from "../closetData";
import { OutfitTab } from "./OutfitTab";
import { BodyTab } from "./BodyTab";
import { AccessoriesTab } from "./AccessoriesTab";
import { CanvasTab } from "./CanvasTab";
import { BackgroundTab } from "./BackgroundTab";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

const TABS: { key: TabKey; label: string; number: number }[] = [
  { key: "body", label: "Body", number: 1 },
  { key: "outfit", label: "Outfit", number: 2 },
  { key: "accessories", label: "Accessories", number: 3 },
  { key: "canvas", label: "Canvas", number: 4 },
  { key: "background", label: "Background", number: 5 },
];

const TAB_BEHAVIORS: Record<TabKey, { snapItems: boolean }> = {
  body: { snapItems: true },
  outfit: { snapItems: true },
  accessories: { snapItems: true },
  canvas: { snapItems: false },
  background: { snapItems: false },
};

type SnapPlacedItem = PlacedItem & {
  isSnapped?: boolean;
  snapAnchor?: { x: number; y: number };
  xNorm?: number;
  yNorm?: number;
  sizeNorm?: number;
};

export function AvatarStudio() {
  const [gender, setGender] = React.useState<Gender>("male");
  const [tab, setTab] = React.useState<TabKey>("body");
  const [placed, setPlaced] = React.useState<SnapPlacedItem[]>([]);
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

  const [canvasSize, setCanvasSize] = React.useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  React.useLayoutEffect(() => {
    const MARGIN = 48;
    const HEADER_RESERVE = 220;

    const updateSize = () => {
      const maxWidth = Math.max(320, window.innerWidth - MARGIN * 2);
      const maxHeight = Math.max(
        320,
        window.innerHeight - HEADER_RESERVE - MARGIN * 2
      );

      const widthByHeight = maxHeight * CANVAS_ASPECT;
      const heightByWidth = maxWidth / CANVAS_ASPECT;

      let width = maxWidth;
      let height = heightByWidth;

      if (widthByHeight <= maxWidth) {
        width = widthByHeight;
        height = maxHeight;
      }

      setCanvasSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Rehydrate all items (snapped or free) when the canvas resizes using normalized data.
  React.useEffect(() => {
    setPlaced((current) =>
      current.map((p) => {
        const sizeNorm = p.sizeNorm ?? (p.size ? p.size / canvasSize.width : 0);
        const xNorm = p.xNorm ?? (p.x ?? 0) / canvasSize.width;
        const yNorm = p.yNorm ?? (p.y ?? 0) / canvasSize.height;

        const sizePx = sizeNorm * canvasSize.width;
        const xPx = xNorm * canvasSize.width;
        const yPx = yNorm * canvasSize.height;

        return {
          ...p,
          sizeNorm,
          xNorm,
          yNorm,
          size: sizePx,
          x: xPx,
          y: yPx,
        };
      })
    );
  }, [canvasSize.width, canvasSize.height]);

  React.useEffect(() => {
    draggingClosetIdRef.current = draggingClosetId;
  }, [draggingClosetId]);

  const lastDropRef = React.useRef<{ key: string; t: number } | null>(null);
  const shouldAcceptDrop = (key: string) => {
    const now = performance.now();
    const last = lastDropRef.current;
    if (last && last.key === key && now - last.t < 500) {
      return false;
    }
    lastDropRef.current = { key, t: now };
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

  const isPlacingItemRef = React.useRef(false);

  const placeClosetItem = (
    closetId: string,
    targetTab: TabKey,
    dropX?: number,
    dropY?: number
  ) => {
    if (isPlacingItemRef.current) return;

    const tabItems = CLOSET_DATA_BY_TAB[targetTab] || [];
    const item = tabItems.find((c) => c.id === closetId);

    if (!item) return;

    const rx = typeof dropX === "number" ? Math.round(dropX) : -1;
    const ry = typeof dropY === "number" ? Math.round(dropY) : -1;
    const dedupeKey = `${targetTab}:${closetId}: ${
      snapItems ? "snap" : "free"
    }: ${rx},${ry}`;
    if (!shouldAcceptDrop(dedupeKey)) return;

    isPlacingItemRef.current = true;

    const resolveSnapAnchor = (cfg: { x: number; y: number }) => ({
      x: cfg.x === 0 ? 0.5 : cfg.x,
      y: cfg.y === 0 ? 0.5 : cfg.y,
    });

    let xNorm: number,
      yNorm: number,
      sizeNorm: number,
      snapAnchor: { x: number; y: number } | undefined;

    // size normalized to canvas width
    sizeNorm = item.size / canvasSize.width;

    if (!snapItems && typeof dropX === "number" && typeof dropY === "number") {
      xNorm = dropX / canvasSize.width - sizeNorm / 2;
      yNorm = dropY / canvasSize.height - sizeNorm / 2;
    } else {
      const snapConfig = SNAP_POSITIONS[item.type as ClosetItemType] ?? {
        x: 0.5,
        y: 0.5,
      };
      snapAnchor = resolveSnapAnchor(snapConfig);
      xNorm = snapAnchor.x - sizeNorm / 2;
      yNorm = snapAnchor.y - sizeNorm / 2;
    }

    const x = xNorm * canvasSize.width;
    const y = yNorm * canvasSize.height;
    const sizePx = sizeNorm * canvasSize.width;

    setTopZ((z) => {
      const newZ = z + 1;
      setPlaced((current) => {
        const existingInstance = current.find(
          (p) =>
            p.id === closetId &&
            Math.abs((p.xNorm ?? 0) - xNorm) < 0.001 &&
            Math.abs((p.yNorm ?? 0) - yNorm) < 0.001
        );
        if (existingInstance) {
          isPlacingItemRef.current = false;
          return current;
        }

        let filtered = current;
        if (replaceSameType) {
          filtered = filtered.filter((p) => p.type !== item.type);
        }
        const newInstanceId = crypto.randomUUID();

        setTimeout(() => {
          isPlacingItemRef.current = false;
        }, 100);

        return [
          ...filtered,
          {
            ...item,
            instanceId: newInstanceId,
            x,
            y,
            size: sizePx,
            z: newZ,
            isSnapped: snapItems,
            snapAnchor,
            xNorm,
            yNorm,
            sizeNorm,
          },
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

  const filteredCloset = CLOSET_DATA_BY_TAB[tab] || [];

  const previewItem = draggingClosetId
    ? Object.values(CLOSET_DATA_BY_TAB)
        .flat()
        .find((c) => c.id === draggingClosetId) ?? null
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
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
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

  const showTrashCan = showTrash && (draggingClosetId || draggingPlacedId);

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

  const totalTabs = TABS.length;
  const selectedTabNumber =
    TABS.find((t) => t.key === tab)?.number ?? Math.max(1, totalTabs);
  const progressPercent = (selectedTabNumber / totalTabs) * 100;

  const tabProgressStyle = React.useMemo(
    () => ({ "--tab-progress": `${progressPercent}%` } as React.CSSProperties),
    [progressPercent]
  );

  return (
    <div className="studio">
      <div className="studioMain">
        <div className="studioTopBar" />
        <div className="studioTabsBar" style={tabProgressStyle}>
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
        width: item.size,
        height: "auto",
        position: "fixed",
        pointerEvents: "none",
        zIndex: 99999,
        transform: "translate(-50%, -50%)",
      }}
    >
      <img
        src={item.src}
        alt={item.name}
        style={{ width: "100%", height: "auto", objectFit: "contain" }}
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
