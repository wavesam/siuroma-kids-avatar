// avatarstudio.tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ClosetItem,
  Gender,
  PlacedItem,
  TabKey,
  ClosetItemType,
} from "../types";
import { CLOSET_DATA_BY_TAB, SNAP_CONFIG } from "../data/closetData";
import { OutfitTab } from "./OutfitTab";
import { BodyTab } from "./BodyTab";
import { AccessoriesTab } from "./AccessoriesTab";
import { CanvasTab } from "./CanvasTab";
import { BackgroundTab } from "./BackgroundTab";
import { exportCanvasToImage, downloadImage } from "../utils/exportCanvas";

// --- Constants ---

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

const TABS: { key: TabKey; label: string; number: number }[] = [
  { key: "body", label: "Body", number: 1 },
  { key: "outfit", label: "Outfit", number: 2 },
  { key: "background", label: "Background", number: 3 },
  { key: "accessories", label: "Accessories", number: 4 },
  { key: "canvas", label: "Canvas", number: 5 },
];

// Tabs where items should float freely by default (no snap)
const FREE_FLOAT_TABS = new Set<TabKey>(["accessories", "canvas"]);

// --- Types ---

export type ResolvedClosetItem = ClosetItem & {
  type: ClosetItemType;
  size: number; // base/design px size (relative to 800x800 canvas)
};

type SnapPlacedItem = PlacedItem & {
  isSnapped?: boolean;
  snapAnchor?: { x: number; y: number };
  xNorm?: number;
  yNorm?: number;
  sizeNorm?: number;
};

// --- Helpers ---

function resolveClosetItem(item: ClosetItem): ResolvedClosetItem | null {
  // Handle background items (which might lack a type)
  if (item.tab === "background" && !item.type) {
    return {
      ...item,
      type: "body", // fallback type for typing satisfaction
      size: CANVAS_WIDTH,
    };
  }

  if (!item.type) return null;

  const cfg = SNAP_CONFIG[item.type];
  return {
    ...item,
    type: item.type,
    size: cfg?.size ?? CANVAS_WIDTH, // Safe fallback
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const DEFAULT_BG: SnapPlacedItem = {
  id: "bg-white",
  name: "Background white",
  tab: "background",
  instanceId: "default-bg",
  src: "",
  type: "body",
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  z: 0,
  size: CANVAS_WIDTH,
  xNorm: 0,
  yNorm: 0,
  sizeNorm: 1,
  color: "#ffffff",
};

// --- Main Component ---

export function AvatarStudio() {
  // Global State
  const [gender, setGender] = useState<Gender>("male");
  const [tab, setTab] = useState<TabKey>("body");
  const [placed, setPlaced] = useState<SnapPlacedItem[]>([DEFAULT_BG]);
  const [topZ, setTopZ] = useState(1);

  // Dragging State
  const [draggingClosetId, setDraggingClosetId] = useState<string | null>(null);
  const [draggingPlacedId, setDraggingPlacedId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const draggingClosetIdRef = useRef<string | null>(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);

  // Canvas / Viewport State
  const [canvasSize, setCanvasSize] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });
  const prevCanvasSizeRef = useRef(canvasSize);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Drawing / Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingHistoryRef = useRef<string[]>([]);
  const drawingHistoryIndexRef = useRef<number>(-1);

  // --- Resize Logic ---

  useLayoutEffect(() => {
    const MARGIN = 48;
    const HEADER_RESERVE = 220;

    const updateSize = () => {
      const vv = window.visualViewport;
      const vpW = vv?.width ?? window.innerWidth;
      const vpH = vv?.height ?? window.innerHeight;

      const maxWidth = Math.max(320, vpW - MARGIN * 2);
      const maxHeight = Math.max(320, vpH - HEADER_RESERVE - MARGIN * 2);

      const widthByHeight = maxHeight * CANVAS_ASPECT;

      let width = maxWidth;
      let height = maxWidth / CANVAS_ASPECT;

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

    // Attach listeners
    const vv = window.visualViewport;
    window.addEventListener("resize", updateSize);
    vv?.addEventListener("resize", updateSize);
    vv?.addEventListener("scroll", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      vv?.removeEventListener("resize", updateSize);
      vv?.removeEventListener("scroll", updateSize);
    };
  }, []);

  // --- Normalization Logic (On Resize) ---

  useEffect(() => {
    const prev = prevCanvasSizeRef.current;
    const prevW = prev.width || 1;
    const prevH = prev.height || 1;

    setPlaced((current) =>
      current.map((p) => {
        // Always center and fill background
        if (p.tab === "background") {
          return {
            ...p,
            x: canvasSize.width / 2,
            y: canvasSize.height / 2,
            size: canvasSize.width,
            xNorm: 0,
            yNorm: 0,
            sizeNorm: 1,
            z: 0,
          };
        }

        if (p.id === "drawing-layer") {
          return { ...p, size: canvasSize.width, x: 0, y: 0 };
        }

        // Calculate normalized values if missing, or use existing to scale to new px
        const baseSizeFromType =
          p.type && SNAP_CONFIG[p.type] ? SNAP_CONFIG[p.type].size : undefined;

        const sizeNorm =
          p.sizeNorm ??
          (typeof baseSizeFromType === "number"
            ? baseSizeFromType / CANVAS_WIDTH
            : (p.size ?? 0) / prevW);

        const xNorm = p.xNorm ?? (p.x ?? 0) / prevW;
        const yNorm = p.yNorm ?? (p.y ?? 0) / prevH;

        return {
          ...p,
          sizeNorm,
          xNorm,
          yNorm,
          size: sizeNorm * canvasSize.width,
          x: xNorm * canvasSize.width,
          y: yNorm * canvasSize.height,
        };
      })
    );

    prevCanvasSizeRef.current = canvasSize;
  }, [canvasSize.width, canvasSize.height]);

  // --- Drag Event Listeners ---

  useEffect(() => {
    draggingClosetIdRef.current = draggingClosetId;
  }, [draggingClosetId]);

  useEffect(() => {
    const onDocDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!draggingClosetIdRef.current) return;
      if (e.clientX === 0 && e.clientY === 0) return;
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const clear = () => {
      setDraggingClosetId(null);
      setDraggingPlacedId(null);
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

  // --- Placement Logic ---

  const isPlacingItemRef = useRef(false);
  const lastDropRef = useRef<{ key: string; t: number } | null>(null);

  const getCanvasLocalDropPoint = (dropX: number, dropY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: dropX, y: dropY };

    const rect = el.getBoundingClientRect();
    const isViewportCoord =
      dropX >= rect.left &&
      dropX <= rect.right &&
      dropY >= rect.top &&
      dropY <= rect.bottom;

    if (isViewportCoord) {
      return { x: dropX - rect.left, y: dropY - rect.top };
    }
    return { x: dropX, y: dropY };
  };

  const placeClosetItem = useCallback(
    (closetId: string, targetTab: TabKey, dropX?: number, dropY?: number) => {
      if (isPlacingItemRef.current) return;

      const tabItems = CLOSET_DATA_BY_TAB[targetTab] || [];
      const rawItem = tabItems.find((c) => c.id === closetId);
      if (!rawItem) return;

      const item = resolveClosetItem(rawItem);
      if (!item) return;

      // Determine Snap Behavior
      // 1. Explicit item prop? 2. Tab default?
      const defaultSnapForTab = !FREE_FLOAT_TABS.has(targetTab);
      const itemSnapItems =
        rawItem.snapItems ?? item.snapItems ?? defaultSnapForTab;

      // Debounce Drop
      const rx = typeof dropX === "number" ? Math.round(dropX) : -1;
      const ry = typeof dropY === "number" ? Math.round(dropY) : -1;
      const dedupeKey = `${targetTab}:${closetId}:${itemSnapItems}:${rx},${ry}`;

      const now = performance.now();
      const last = lastDropRef.current;
      if (last && last.key === dedupeKey && now - last.t < 500) return;
      lastDropRef.current = { key: dedupeKey, t: now };

      isPlacingItemRef.current = true;

      // Placement Calculation
      const isBackground = targetTab === "background";

      // Normalized Size
      // If background, scale is 1.0 (100%). Else relative to Design Canvas.
      const sizeNorm = isBackground ? 1.0 : item.size / CANVAS_WIDTH;

      let xNorm: number;
      let yNorm: number;
      let snapAnchor: { x: number; y: number } | undefined;

      if (isBackground) {
        // Force Center
        snapAnchor = { x: 0.5, y: 0.5 };
        xNorm = 0.5 - sizeNorm / 2;
        yNorm = 0.5 - sizeNorm / 2;
      } else if (
        !itemSnapItems &&
        typeof dropX === "number" &&
        typeof dropY === "number"
      ) {
        // Free Placement
        const local = getCanvasLocalDropPoint(dropX, dropY);
        const rect = canvasRef.current?.getBoundingClientRect();
        const w = rect?.width ?? canvasSize.width;
        const h = rect?.height ?? canvasSize.height;

        const x01 = clamp(local.x / (w || 1), 0, 1);
        const y01 = clamp(local.y / (h || 1), 0, 1);

        xNorm = x01 - sizeNorm / 2;
        yNorm = y01 - sizeNorm / 2;
      } else {
        // Snapped Placement
        const cfg = SNAP_CONFIG[item.type] ?? {
          x: 0.5,
          y: 0.5,
          size: item.size,
        };
        snapAnchor = {
          x: cfg.x === 0 ? 0.5 : cfg.x,
          y: cfg.y === 0 ? 0.5 : cfg.y,
        };
        xNorm = snapAnchor.x - sizeNorm / 2;
        yNorm = snapAnchor.y - sizeNorm / 2;
      }

      const x = xNorm * canvasSize.width;
      const y = yNorm * canvasSize.height;
      const sizePx = sizeNorm * canvasSize.width;

      setTopZ((z) => {
        const newZ = z + 1;
        setPlaced((current) => {
          // Prevent exact duplicates
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

          // Cleanup before adding
          if (isBackground) {
            filtered = filtered.filter((p) => p.tab !== "background");
          } else if (itemSnapItems) {
            // Replace items of same type if snapping is enabled for this item
            filtered = filtered.filter((p) => p.type !== item.type);
          }

          setTimeout(() => {
            isPlacingItemRef.current = false;
          }, 100);

          return [
            ...filtered,
            {
              ...item,
              instanceId: crypto.randomUUID(),
              // For background, x/y are forced to center for logic consistency
              x: isBackground ? canvasSize.width / 2 : x,
              y: isBackground ? canvasSize.height / 2 : y,
              size: isBackground ? canvasSize.width : sizePx,
              z: isBackground ? 0 : newZ,
              snapItems: itemSnapItems,
              isSnapped: itemSnapItems,
              snapAnchor,
              xNorm,
              yNorm,
              sizeNorm,
            },
          ];
        });
        return newZ;
      });
    },
    [canvasSize.width, canvasSize.height]
  );

  // --- Deletion Logic ---

  const removePlacedByInstanceId = (instanceId: string) => {
    setPlaced((current) =>
      current.filter((item) => item.instanceId !== instanceId)
    );
  };

  const removePlacedByClosetId = (closetId: string) => {
    setPlaced((current) => current.filter((item) => item.id !== closetId));
  };

  const handleTrashDrop = () => {
    if (draggingPlacedId) {
      removePlacedByInstanceId(draggingPlacedId);
      setDraggingPlacedId(null);
    }
    if (draggingClosetId) {
      removePlacedByClosetId(draggingClosetId);
      setDraggingClosetId(null);
      setDragPos(null);
    }
    setIsHoveringTrash(false);
  };

  // --- Export / Output ---

  const handleExportCanvas = async (): Promise<string | null> => {
    const hasBackground = placed.some((p) => p.tab === "background");
    return await exportCanvasToImage({
      avatarCanvasElement: canvasRef.current,
      drawingCanvasElement: drawingCanvasRef.current,
      scale: 2,
      backgroundColor: hasBackground ? null : "#ffffff",
    });
  };

  const handleShare = async () => {
    const dataUrl = await handleExportCanvas();
    if (!dataUrl) return window.alert("Failed to generate image.");

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `avatar-${Date.now()}.png`, {
      type: "image/png",
    });

    // Try Native Share with Files
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: "My Avatar", files: [file] });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") console.warn("Share failed:", err);
      }
    }

    // Try Clipboard
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      window.alert("Image copied to clipboard!");
    } catch (err) {
      downloadImage(dataUrl); // Fallback
    }
  };

  const handleDownload = async () => {
    const dataUrl = await handleExportCanvas();
    if (dataUrl) downloadImage(dataUrl);
  };

  const handlePreviewOpen = async () => {
    setIsPreviewOpen(true);
    setPreviewImage(await handleExportCanvas());
  };

  // --- Render Prep ---

  const filteredCloset = CLOSET_DATA_BY_TAB[tab] || [];

  // Determine Ghost Image
  const previewRawItem = draggingClosetId
    ? Object.values(CLOSET_DATA_BY_TAB)
        .flat()
        .find((c) => c.id === draggingClosetId) ?? null
    : null;
  const previewItem = previewRawItem ? resolveClosetItem(previewRawItem) : null;

  // Determine UI State
  const snapItemsForTab = !FREE_FLOAT_TABS.has(tab);
  const showTrash = !snapItemsForTab; // Show trash if we are in free-float mode
  const showTrashCan = showTrash && (!!draggingClosetId || !!draggingPlacedId);

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
    snapItems: snapItemsForTab,
    showTrash,
    removePlacedByClosetId,
    setIsHoveringTrash,
    isHoveringTrash,
    setDraggingPlacedId,
    draggingPlacedId,
    removePlacedByInstanceId,
    canvasRef,
  } as const;

  const totalTabs = TABS.length;
  const selectedTabNumber = TABS.find((t) => t.key === tab)?.number ?? 1;
  const progressPercent = (selectedTabNumber / totalTabs) * 100;
  const tabProgressStyle = useMemo(
    () => ({ "--tab-progress": `${progressPercent}%` } as React.CSSProperties),
    [progressPercent]
  );

  return (
    <div className="studio">
      <div className="studioMain">
        <div className="studioTopBar" />
        <div className="studioTabsBarWrapper">
          <div className="studioTabsBar" style={tabProgressStyle}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-selected={tab === t.key}
                className={
                  tab === t.key ? "studioTab tabSelected" : "studioTab"
                }
                type="button"
              >
                <span className="studioTabNumber">{t.number}</span>
                <span className="studioTabLabel">{t.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="studioFinishButton"
            onClick={handlePreviewOpen}
          >
            Finish
          </button>
        </div>

        {tab === "body" && <BodyTab {...sharedTabProps} />}
        {tab === "outfit" && <OutfitTab {...sharedTabProps} />}
        {tab === "background" && <BackgroundTab {...sharedTabProps} />}
        {tab === "accessories" && <AccessoriesTab {...sharedTabProps} />}
        {tab === "canvas" && (
          <CanvasTab
            {...sharedTabProps}
            avatarCanvasRef={canvasRef}
            drawingCanvasRef={drawingCanvasRef}
            drawingHistoryRef={drawingHistoryRef}
            drawingHistoryIndexRef={drawingHistoryIndexRef}
          />
        )}

        <DragGhost item={previewItem} pos={dragPos} />
        <TrashCan
          visible={showTrashCan}
          isHover={isHoveringTrash}
          setIsHoveringTrash={setIsHoveringTrash}
          onDrop={handleTrashDrop}
        />
        {isPreviewOpen && (
          <SavePreviewModal
            onClose={() => {
              setIsPreviewOpen(false);
              setPreviewImage(null);
            }}
            onDownload={handleDownload}
            onShare={handleShare}
            previewImage={previewImage}
          />
        )}
      </div>
    </div>
  );
}

// --- Sub Components ---

function SavePreviewModal({
  onClose,
  onDownload,
  onShare,
  previewImage,
}: {
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
  previewImage: string | null;
}) {
  return (
    <div className="savePreviewOverlay" role="dialog" aria-modal="true">
      <div className="savePreviewCard">
        <div className="savePreviewHeader">
          <h2>Preview</h2>
          <button
            type="button"
            aria-label="Close preview"
            className="iconButton"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="savePreviewBody">
          <div className="previewFrame">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Avatar Preview"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ) : (
              <p className="previewHint">Generating preview...</p>
            )}
          </div>
          <div className="saveActions">
            <button
              type="button"
              className="primaryAction"
              onClick={onDownload}
              disabled={!previewImage}
            >
              Download
            </button>
            <button
              type="button"
              className="secondaryAction"
              onClick={onShare}
              disabled={!previewImage}
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DragGhost({
  item,
  pos,
}: {
  item: ResolvedClosetItem | null;
  pos: { x: number; y: number } | null;
}) {
  if (!item || !pos) return null;
  return (
    <div
      className="dragGhost"
      style={{
        left: pos.x,
        top: pos.y,
        width: 200, // Fixed width for drag preview
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
        onDrop();
      }}
    >
      <span role="img" aria-label="Trash">
        🗑️
      </span>
    </div>
  );
}
