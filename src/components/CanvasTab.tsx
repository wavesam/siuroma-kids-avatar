import React from "react";
import { AvatarCanvas } from "./AvatarCanvas";
import { Closet } from "./Closet";
import type { PlacedItem, Gender, TabKey, ClosetItem } from "../types";
import "./CanvasTab.css";

interface CanvasTabProps {
  gender: Gender;
  tab: TabKey;
  placed: PlacedItem[];
  setPlaced: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  setDraggingClosetId: (id: string | null) => void;
  setDragPos: (pos: { x: number; y: number } | null) => void;
  closet: ClosetItem[];
  canvasWidth: number;
  canvasHeight: number;
  placeClosetItem: (
    closetId: string,
    tab: TabKey,
    dropX?: number,
    dropY?: number
  ) => void;
  snapItems: boolean;
  setDraggingPlacedId: (id: string | null) => void;
  setIsHoveringTrash: (b: boolean) => void;
  isHoveringTrash: boolean;
  removePlacedByInstanceId: (iid: string) => void;

  avatarCanvasRef: React.RefObject<HTMLDivElement | null>;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;

  // History stored as PNG data URLs
  drawingHistoryRef: React.MutableRefObject<string[]>;
  drawingHistoryIndexRef: React.MutableRefObject<number>;
}

type DrawingTool = "brush" | "eraser";

const DRAWING_LAYER_ID = "drawing-layer";
const MAX_HISTORY = 50;

export function CanvasTab(props: CanvasTabProps) {
  const {
    gender,
    tab,
    placed,
    setPlaced,
    setDraggingClosetId,
    setDragPos,
    canvasWidth,
    canvasHeight,
    placeClosetItem,
    snapItems,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
    closet,
    avatarCanvasRef,
    drawingCanvasRef,
    drawingHistoryRef,
    drawingHistoryIndexRef,
  } = props;

  const [tool, setTool] = React.useState<DrawingTool>("brush");
  const [brushSize, setBrushSize] = React.useState(10);
  const [brushColor, setBrushColor] = React.useState("#333333");
  const [multiPointEnabled, setMultiPointEnabled] = React.useState(false);
  const [multiPointCount, setMultiPointCount] = React.useState(5);
  const [multiPointSpread, setMultiPointSpread] = React.useState(10);

  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const isInitializingRef = React.useRef(true);
  const isRestoringRef = React.useRef(false);
  const dprRef = React.useRef<number>(window.devicePixelRatio || 1);

  const placedWithoutDrawing = React.useMemo(
    () => placed.filter((p) => p.id !== DRAWING_LAYER_ID),
    [placed]
  );

  const updateHistoryButtons = React.useCallback(() => {
    setCanUndo(drawingHistoryIndexRef.current > 0);
    setCanRedo(
      drawingHistoryIndexRef.current >= 0 &&
        drawingHistoryIndexRef.current < drawingHistoryRef.current.length - 1
    );
  }, [drawingHistoryIndexRef, drawingHistoryRef]);

  const persistDrawingLayer = React.useCallback(
    (dataUrl: string) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      setPlaced((current) => {
        const others = current.filter((p) => p.id !== DRAWING_LAYER_ID);
        return [
          ...others,
          {
            id: DRAWING_LAYER_ID,
            instanceId: DRAWING_LAYER_ID,
            tab: "canvas",
            type: "drawing",
            src: dataUrl,
            x: 0,
            y: 0,
            z: 9999,
            size: canvas.width,
            xNorm: 0,
            yNorm: 0,
            sizeNorm: 1,
          } as any,
        ];
      });
    },
    [drawingCanvasRef, setPlaced]
  );

  const syncCanvasResolution = React.useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const nextW = Math.max(1, Math.round(rect.width * dpr));
    const nextH = Math.max(1, Math.round(rect.height * dpr));

    const sizeChanged = canvas.width !== nextW || canvas.height !== nextH;
    if (sizeChanged) {
      canvas.width = nextW;
      canvas.height = nextH;
    }

    // Always ensure transform is correct for CSS-pixel drawing coords
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }, [drawingCanvasRef]);

  const renderDataUrlToCanvas = React.useCallback(
    async (dataUrl: string) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      isRestoringRef.current = true;

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          // draw in raw pixel space (identity transform)
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // restore transform for normal drawing (CSS pixels)
          const dpr = dprRef.current || 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = dataUrl;
      });

      isRestoringRef.current = false;
    },
    [drawingCanvasRef]
  );

  const saveState = React.useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    if (isRestoringRef.current) return;

    // Ensure canvas internal size matches DOM size before snapshot
    syncCanvasResolution();

    try {
      // Save as PNG snapshot
      const dataUrl = canvas.toDataURL("image/png");

      // Truncate redo states if we are not at the end
      const idx = drawingHistoryIndexRef.current;
      if (idx < drawingHistoryRef.current.length - 1) {
        drawingHistoryRef.current = drawingHistoryRef.current.slice(0, idx + 1);
      }

      const last =
        drawingHistoryRef.current[drawingHistoryRef.current.length - 1];
      if (last !== dataUrl) {
        drawingHistoryRef.current.push(dataUrl);
        drawingHistoryIndexRef.current = drawingHistoryRef.current.length - 1;

        if (drawingHistoryRef.current.length > MAX_HISTORY) {
          drawingHistoryRef.current.shift();
          drawingHistoryIndexRef.current = Math.max(
            0,
            drawingHistoryIndexRef.current - 1
          );
        }
      }

      updateHistoryButtons();
      persistDrawingLayer(dataUrl);
    } catch (error) {
      console.error("Error saving drawing state:", error);
    }
  }, [
    drawingCanvasRef,
    drawingHistoryRef,
    drawingHistoryIndexRef,
    updateHistoryButtons,
    persistDrawingLayer,
    syncCanvasResolution,
  ]);

  const restoreState = React.useCallback(
    async (index: number) => {
      const history = drawingHistoryRef.current;
      if (index < 0 || index >= history.length) return;

      const dataUrl = history[index];
      if (!dataUrl) return;

      // Ensure canvas resolution is correct for current layout, then render snapshot
      syncCanvasResolution();
      await renderDataUrlToCanvas(dataUrl);

      drawingHistoryIndexRef.current = index;
      updateHistoryButtons();

      // Crucial: persist restored snapshot so tab switches don’t “revert”
      persistDrawingLayer(dataUrl);
    },
    [
      drawingHistoryRef,
      drawingHistoryIndexRef,
      updateHistoryButtons,
      persistDrawingLayer,
      syncCanvasResolution,
      renderDataUrlToCanvas,
    ]
  );

  const undo = React.useCallback(() => {
    if (drawingHistoryIndexRef.current > 0) {
      void restoreState(drawingHistoryIndexRef.current - 1);
    }
  }, [restoreState, drawingHistoryIndexRef]);

  const redo = React.useCallback(() => {
    if (
      drawingHistoryIndexRef.current >= 0 &&
      drawingHistoryIndexRef.current < drawingHistoryRef.current.length - 1
    ) {
      void restoreState(drawingHistoryIndexRef.current + 1);
    }
  }, [restoreState, drawingHistoryIndexRef, drawingHistoryRef]);

  React.useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    syncCanvasResolution();

    // Buttons should reflect whatever persisted history exists (from parent refs)
    updateHistoryButtons();

    const savedDrawing = placed.find((p) => p.id === DRAWING_LAYER_ID);

    const init = async () => {
      if (savedDrawing?.src) {
        await renderDataUrlToCanvas(savedDrawing.src);

        // Initialize history only if empty (so switching tabs doesn’t wipe undo stack)
        if (drawingHistoryRef.current.length === 0) {
          drawingHistoryRef.current = [savedDrawing.src];
          drawingHistoryIndexRef.current = 0;
          updateHistoryButtons();
        } else {
          // Ensure current history snapshot is rendered (in case resize changed)
          const idx = drawingHistoryIndexRef.current;
          const cur = drawingHistoryRef.current[idx];
          if (cur) {
            await renderDataUrlToCanvas(cur);
          }
          updateHistoryButtons();
        }
      } else {
        // No saved image: ensure we at least have a blank initial state
        if (drawingHistoryRef.current.length === 0) {
          const blank = canvas.toDataURL("image/png");
          drawingHistoryRef.current = [blank];
          drawingHistoryIndexRef.current = 0;
          updateHistoryButtons();
          persistDrawingLayer(blank);
        } else {
          const idx = drawingHistoryIndexRef.current;
          const cur = drawingHistoryRef.current[idx];
          if (cur) {
            await renderDataUrlToCanvas(cur);
          }
          updateHistoryButtons();
        }
      }

      isInitializingRef.current = false;
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync canvas resolution on layout changes WITHOUT pushing new history entries
  React.useEffect(() => {
    if (isInitializingRef.current) return;

    syncCanvasResolution();

    const idx = drawingHistoryIndexRef.current;
    const cur = drawingHistoryRef.current[idx];
    if (cur) {
      void renderDataUrlToCanvas(cur);
    }
  }, [
    canvasWidth,
    canvasHeight,
    syncCanvasResolution,
    renderDataUrlToCanvas,
    drawingHistoryRef,
    drawingHistoryIndexRef,
  ]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawMultiPoint = React.useCallback(
    (
      center: { x: number; y: number },
      ctx: CanvasRenderingContext2D,
      size: number
    ) => {
      for (let i = 0; i < multiPointCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * multiPointSpread;
        const x = center.x + Math.cos(angle) * distance;
        const y = center.y + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.arc(x, y, (size * (0.6 + Math.random() * 0.4)) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [multiPointCount, multiPointSpread]
  );

  const draw = React.useCallback(
    (
      point: { x: number; y: number },
      prevPoint: { x: number; y: number } | null
    ) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Ensure correct transform for CSS-pixel drawing
      const dpr = dprRef.current || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (tool === "brush") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.lineWidth = brushSize;
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = brushSize * 2;
      }

      if (multiPointEnabled && tool === "brush") {
        if (prevPoint) {
          const distance = Math.sqrt(
            Math.pow(point.x - prevPoint.x, 2) +
              Math.pow(point.y - prevPoint.y, 2)
          );
          const steps = Math.max(3, Math.floor(distance / (brushSize / 2)));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = prevPoint.x + (point.x - prevPoint.x) * t;
            const y = prevPoint.y + (point.y - prevPoint.y) * t;
            drawMultiPoint({ x, y }, ctx, brushSize);
          }
        } else {
          drawMultiPoint(point, ctx, brushSize);
        }
      } else {
        if (prevPoint) {
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [
      tool,
      brushSize,
      brushColor,
      multiPointEnabled,
      drawMultiPoint,
      drawingCanvasRef,
    ]
  );

  const prevPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasStartedDrawingRef = React.useRef(false);

  const handleStart = React.useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      setDraggingClosetId?.(null);
      setDraggingPlacedId?.(null);

      // If user starts drawing after undo, next saveState() will truncate redo history
      const point = getPointFromEvent(e);
      if (!point) return;

      setIsDrawing(true);
      prevPointRef.current = null;
      hasStartedDrawingRef.current = false;

      draw(point, null);
      prevPointRef.current = point;
      hasStartedDrawingRef.current = true;
    },
    [draw, setDraggingClosetId, setDraggingPlacedId]
  );

  const handleMove = React.useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing) return;
      const point = getPointFromEvent(e);
      if (!point) return;
      draw(point, prevPointRef.current);
      prevPointRef.current = point;
    },
    [isDrawing, draw]
  );

  const handleEnd = React.useCallback(() => {
    if (isDrawing && hasStartedDrawingRef.current) {
      setIsDrawing(false);
      prevPointRef.current = null;
      hasStartedDrawingRef.current = false;
      saveState();
    }
  }, [isDrawing, saveState]);

  React.useEffect(() => {
    const handleMouseUp = () => handleEnd();
    const handleMouseLeave = () => handleEnd();
    const handleTouchEnd = () => handleEnd();
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDrawing, handleEnd]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleDragOverCanvas = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      e.dataTransfer.dropEffect = "copy";
    },
    [setDragPos]
  );

  const handleDropOnCanvas = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const id =
        e.dataTransfer.getData("application/x-avatar-item-id") ||
        e.dataTransfer.getData("text/plain");
      if (!id) return;

      const container = canvasContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        placeClosetItem(id, tab, e.clientX - rect.left, e.clientY - rect.top);
      } else {
        placeClosetItem(id, tab);
      }
      setDragPos(null);
      setDraggingClosetId(null);
    },
    [placeClosetItem, tab, setDragPos, setDraggingClosetId]
  );

  const handleDragLeaveCanvas = React.useCallback(() => {
    setDragPos(null);
  }, [setDragPos]);

  const colorPresets = [
    "#FF6B6B",
    "#FF9F43",
    "#Feca57",
    "#48dbfb",
    "#ff9ff3",
    "#54a0ff",
    "#5f27cd",
    "#000000",
  ];

  const toolsPanel = (
    <>
      <div className="art-tools-hero">
        <span className="hero-icon">🎨</span>
        <div className="hero-text">
          <span className="hero-title">Studio Tools</span>
          <span className="hero-subtitle">Let's create!</span>
        </div>
      </div>

      <div className="tool-selector-group">
        <button
          className={`big-tool-btn ${tool === "brush" ? "active" : ""}`}
          onClick={() => setTool("brush")}
          title="Paint Brush"
          type="button"
        >
          <span className="big-tool-icon">✏️</span>
          <span className="big-tool-label">Draw</span>
        </button>
        <button
          className={`big-tool-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => setTool("eraser")}
          title="Eraser"
          type="button"
        >
          <span className="big-tool-icon">🧼</span>
          <span className="big-tool-label">Erase</span>
        </button>
      </div>

      {tool === "brush" && (
        <>
          <div className="control-card">
            <div className="card-header">
              <span>Size</span>
              <span className="value-badge">{brushSize}px</span>
            </div>
            <input
              className="chunky-slider"
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>

          <div className="control-card">
            <div className="card-header">Color Palette</div>
            <div className="palette-grid">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${brushColor === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setBrushColor(c)}
                  type="button"
                />
              ))}
              <div className="custom-picker-wrapper">
                <input
                  type="color"
                  className="custom-picker-input"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                />
                <span className="plus-icon">+</span>
              </div>
            </div>
          </div>

          <div className="control-card highlight">
            <div className="card-header toggle-header">
              <span>Magic Dust</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={multiPointEnabled}
                  onChange={(e) => setMultiPointEnabled(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {multiPointEnabled && (
              <div className="magic-controls">
                <div className="mini-control">
                  <span className="mini-label">Dots</span>
                  <input
                    className="chunky-slider mini"
                    type="range"
                    min="2"
                    max="20"
                    value={multiPointCount}
                    onChange={(e) => setMultiPointCount(Number(e.target.value))}
                  />
                </div>
                <div className="mini-control">
                  <span className="mini-label">Spread</span>
                  <input
                    className="chunky-slider mini"
                    type="range"
                    min="2"
                    max="30"
                    value={multiPointSpread}
                    onChange={(e) =>
                      setMultiPointSpread(Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tool === "eraser" && (
        <div className="control-card">
          <div className="card-header">
            <span>Eraser Size</span>
            <span className="value-badge">{brushSize * 2}px</span>
          </div>
          <input
            className="chunky-slider"
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
      )}

      <div className="history-row">
        <button
          className="history-pill"
          onClick={undo}
          disabled={!canUndo}
          type="button"
        >
          <span className="icon">↩️</span> Undo
        </button>
        <button
          className="history-pill"
          onClick={redo}
          disabled={!canRedo}
          type="button"
        >
          Redo <span className="icon">↪️</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="studioBody">
      <div className="left" style={{ position: "relative", zIndex: 50 }}>
        <div
          className="canvasContainer"
          ref={(node) => {
            canvasContainerRef.current = node;
            if (avatarCanvasRef) {
              if (typeof avatarCanvasRef === "function") {
                (avatarCanvasRef as unknown as Function)(node);
              } else {
                (
                  avatarCanvasRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = node;
              }
            }
          }}
          onDragOver={handleDragOverCanvas}
          onDrop={handleDropOnCanvas}
          onDragLeave={handleDragLeaveCanvas}
        >
          <AvatarCanvas
            gender={gender}
            tab={tab}
            size={300}
            offsetY={0}
            placed={placedWithoutDrawing}
            setPlaced={setPlaced}
            freelyDraggable={!snapItems}
            setDraggingPlacedId={setDraggingPlacedId}
            setIsHoveringTrash={setIsHoveringTrash}
            isHoveringTrash={isHoveringTrash}
            removePlacedByInstanceId={removePlacedByInstanceId}
            placeClosetItem={placeClosetItem}
            snapItems={snapItems}
          />

          <canvas
            ref={drawingCanvasRef}
            className="drawingCanvas"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{
              cursor: tool === "brush" ? "crosshair" : "grab",
            }}
          />
        </div>
      </div>

      <div className="right">
        <Closet
          items={closet.filter((it) => it.tab === tab)}
          avatarGender={gender}
          tab={tab}
          onStartDrag={(id) => setDraggingClosetId(id)}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
        >
          {toolsPanel}
        </Closet>
      </div>
    </div>
  );
}
