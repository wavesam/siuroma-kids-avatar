// avatarstudio.tsx
import React, { type JSX } from "react";
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

const TAB_BEHAVIORS: Record<TabKey, { snapItems: boolean }> = {
  body: { snapItems: true },
  outfit: { snapItems: true },
  background: { snapItems: true },
  accessories: { snapItems: false },
  canvas: { snapItems: true },
};

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

function resolveClosetItem(item: ClosetItem): ResolvedClosetItem | null {
  // ✅ Support background items with no type (images or gradients)
  if (item.tab === "background" && !item.type) {
    return {
      ...item,
      type: "body", // default type to satisfy typing / snap config access
      size: CANVAS_WIDTH, // fill canvas width
    };
  }

  if (!item.type) return null;

  const cfg = SNAP_CONFIG[item.type];
  return {
    ...item,
    type: item.type,
    size: cfg.size,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Default background on first load (white)
const DEFAULT_BG: SnapPlacedItem = {
  id: "bg-white",
  name: "Background white",
  tab: "background",
  instanceId: "default-bg",
  src: "",
  type: "body", // keep as-is to satisfy existing PlacedItem typing in your app
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  z: 0,
  size: CANVAS_WIDTH,
  xNorm: 0,
  yNorm: 0,
  sizeNorm: 1,
  color: "#ffffff",
};

export function AvatarStudio() {
  const [gender, setGender] = React.useState<Gender>("male");
  const [tab, setTab] = React.useState<TabKey>("body");

  // ✅ Start with a white background already placed (so you see it on page entry)
  const [placed, setPlaced] = React.useState<SnapPlacedItem[]>(() => [
    DEFAULT_BG,
  ]);

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

  const prevCanvasSizeRef = React.useRef(canvasSize);

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Refs for export and persistence
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const drawingCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // --- History Persistence ---
  // Store as PNG data URLs (resilient to resize + easy to persist)
  const drawingHistoryRef = React.useRef<string[]>([]);
  const drawingHistoryIndexRef = React.useRef<number>(-1);

  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    const MARGIN = 48;
    const HEADER_RESERVE = 220;

    const getViewport = () => {
      const vv = window.visualViewport;
      return {
        width: vv?.width ?? window.innerWidth,
        height: vv?.height ?? window.innerHeight,
      };
    };

    const updateSize = () => {
      const vp = getViewport();

      const maxWidth = Math.max(320, vp.width - MARGIN * 2);
      const maxHeight = Math.max(320, vp.height - HEADER_RESERVE - MARGIN * 2);

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

  React.useEffect(() => {
    const prev = prevCanvasSizeRef.current;
    const prevW = prev.width || 1;
    const prevH = prev.height || 1;

    setPlaced((current) =>
      current.map((p) => {
        // ✅ Keep the background always covering the canvas after resizes
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

        const baseSizeFromType =
          p.type && SNAP_CONFIG[p.type] ? SNAP_CONFIG[p.type].size : undefined;

        const sizeNorm =
          p.sizeNorm ??
          (typeof baseSizeFromType === "number"
            ? baseSizeFromType / CANVAS_WIDTH
            : p.size
            ? p.size / prevW
            : 0);

        const xNorm = p.xNorm ?? (p.x ?? 0) / prevW;
        const yNorm = p.yNorm ?? (p.y ?? 0) / prevH;

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

    prevCanvasSizeRef.current = canvasSize;
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

  const getCanvasLocalDropPoint = (dropX: number, dropY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: dropX, y: dropY };

    const rect = el.getBoundingClientRect();

    // Heuristic:
    // - If (dropX, dropY) are within the rect in viewport space, treat them as viewport coords.
    // - Otherwise, assume caller already passed canvas-local coords.
    const looksViewport =
      dropX >= rect.left &&
      dropX <= rect.right &&
      dropY >= rect.top &&
      dropY <= rect.bottom;

    if (looksViewport) {
      return { x: dropX - rect.left, y: dropY - rect.top };
    }

    return { x: dropX, y: dropY };
  };

  const placeClosetItem = (
    closetId: string,
    targetTab: TabKey,
    dropX?: number,
    dropY?: number
  ) => {
    if (isPlacingItemRef.current) return;

    const tabItems = CLOSET_DATA_BY_TAB[targetTab] || [];
    const rawItem = tabItems.find((c) => c.id === closetId);
    if (!rawItem) return;

    const item = resolveClosetItem(rawItem);
    if (!item) return;

    const rx = typeof dropX === "number" ? Math.round(dropX) : -1;
    const ry = typeof dropY === "number" ? Math.round(dropY) : -1;
    const dedupeKey = `${targetTab}:${closetId}:${
      snapItems ? "snap" : "free"
    }:${rx},${ry}`;
    if (!shouldAcceptDrop(dedupeKey)) return;

    isPlacingItemRef.current = true;

    const resolveSnapAnchor = (cfg: { x: number; y: number }) => ({
      x: cfg.x === 0 ? 0.5 : cfg.x,
      y: cfg.y === 0 ? 0.5 : cfg.y,
    });

    // IMPORTANT: normalize against the fixed design canvas (800),
    // not the current CSS pixel size (canvasSize.width), so zoom doesn't change sizes.
    let sizeNorm = item.size / CANVAS_WIDTH;

    // ✅ Background always fills the whole canvas
    if (targetTab === "background") {
      sizeNorm = 1.0;
    }

    let xNorm: number;
    let yNorm: number;
    let snapAnchor: { x: number; y: number } | undefined;

    if (!snapItems && typeof dropX === "number" && typeof dropY === "number") {
      const local = getCanvasLocalDropPoint(dropX, dropY);

      const rect = canvasRef.current?.getBoundingClientRect();
      const w = rect?.width ?? canvasSize.width;
      const h = rect?.height ?? canvasSize.height;

      const x01 = clamp(local.x / (w || 1), 0, 1);
      const y01 = clamp(local.y / (h || 1), 0, 1);

      xNorm = x01 - sizeNorm / 2;
      yNorm = y01 - sizeNorm / 2;
    } else {
      const cfg = SNAP_CONFIG[item.type] ?? { x: 0.5, y: 0.5, size: item.size };
      snapAnchor = resolveSnapAnchor({ x: cfg.x, y: cfg.y });
      xNorm = snapAnchor.x - sizeNorm / 2;
      yNorm = snapAnchor.y - sizeNorm / 2;
    }

    // ✅ Background override: fill + center
    if (targetTab === "background") {
      snapAnchor = { x: 0.5, y: 0.5 };
      xNorm = 0.5 - sizeNorm / 2;
      yNorm = 0.5 - sizeNorm / 2;
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

        // ✅ Background replacement: keep only one background at a time
        if (targetTab === "background") {
          filtered = filtered.filter((p) => p.tab !== "background");
        } else if (replaceSameType) {
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
            // For background items, x/y are not used for rendering (they're applied via CSS),
            // but keep them consistent for any export/debug logic.
            x: targetTab === "background" ? canvasSize.width / 2 : x,
            y: targetTab === "background" ? canvasSize.height / 2 : y,
            size: targetTab === "background" ? canvasSize.width : sizePx,
            z: targetTab === "background" ? 0 : newZ,
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

  const previewRawItem = draggingClosetId
    ? Object.values(CLOSET_DATA_BY_TAB)
        .flat()
        .find((c) => c.id === draggingClosetId) ?? null
    : null;

  const previewItem = previewRawItem ? resolveClosetItem(previewRawItem) : null;

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
    canvasRef,
  } as const;

  let TabContent: JSX.Element | null = null;
  switch (tab) {
    case "body":
      TabContent = <BodyTab {...sharedTabProps} />;
      break;
    case "outfit":
      TabContent = <OutfitTab {...sharedTabProps} />;
      break;
    case "background":
      TabContent = <BackgroundTab {...sharedTabProps} />;
      break;
    case "accessories":
      TabContent = <AccessoriesTab {...sharedTabProps} />;
      break;
    case "canvas":
      TabContent = (
        <CanvasTab
          {...sharedTabProps}
          avatarCanvasRef={canvasRef}
          drawingCanvasRef={drawingCanvasRef}
          drawingHistoryRef={drawingHistoryRef}
          drawingHistoryIndexRef={drawingHistoryIndexRef}
        />
      );
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

  const handleExportCanvas = async (): Promise<string | null> => {
    // ✅ If a background exists in DOM, let it render naturally into the export.
    // ✅ If it doesn't exist (e.g., user deleted it), fallback to white.
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
    if (!dataUrl) {
      window.alert("Failed to generate image. Please try again.");
      return;
    }

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `avatar-${Date.now()}.png`, {
      type: "image/png",
    });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: "My Avatar",
          text: "Check out my avatar creation!",
          files: [file],
        });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Share failed:", err);
        } else {
          return;
        }
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Avatar",
          text: "Check out my avatar creation!",
        });
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Share failed:", err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      window.alert("Image copied to clipboard! You can paste it elsewhere.");
    } catch (clipboardErr) {
      console.error("Clipboard copy failed:", clipboardErr);
      window.alert(
        "Could not share automatically. Please download the image and share manually."
      );
    }
  };

  const handleDownload = async () => {
    const dataUrl = await handleExportCanvas();
    if (!dataUrl) {
      window.alert("Export failed, please try again.");
      return;
    }
    downloadImage(dataUrl);
  };

  const handlePreviewOpen = async () => {
    setIsPreviewOpen(true);
    const dataUrl = await handleExportCanvas();
    setPreviewImage(dataUrl);
  };

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
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "100%",
                  display: "block",
                }}
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
        width: 200,
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
