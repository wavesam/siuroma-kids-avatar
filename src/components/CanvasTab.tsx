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
}

type DrawingTool = "brush" | "eraser";

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
  } = props;

  const [tool, setTool] = React.useState<DrawingTool>("brush");
  const [brushSize, setBrushSize] = React.useState(10);
  const [brushColor, setBrushColor] = React.useState("#333333");
  const [multiPointEnabled, setMultiPointEnabled] = React.useState(false);
  const [multiPointCount, setMultiPointCount] = React.useState(5);
  const [multiPointSpread, setMultiPointSpread] = React.useState(10);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const historyRef = React.useRef<ImageData[]>([]);
  const historyIndexRef = React.useRef(-1);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const updateHistoryButtons = React.useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const saveState = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(
        0,
        historyIndexRef.current + 1
      );
    }

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(imageData);
      historyIndexRef.current = historyRef.current.length - 1;

      const MAX_HISTORY = 50;
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }

      updateHistoryButtons();
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }, [updateHistoryButtons]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      const hasExistingContent = canvas.width > 0 && canvas.height > 0;
      let imageData: ImageData | null = null;

      if (hasExistingContent && historyRef.current.length > 0) {
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error("Error saving canvas content before resize:", error);
        }
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.scale(dpr, dpr);

      if (imageData) {
        if (
          imageData.width !== rect.width * dpr ||
          imageData.height !== rect.height * dpr
        ) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = imageData.width;
          tempCanvas.height = imageData.height;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
          }
        } else {
          ctx.putImageData(imageData, 0, 0);
        }
        saveState();
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (historyRef.current.length === 0) {
          saveState();
        }
      }
    }
  }, [canvasWidth, canvasHeight, saveState]);

  const restoreState = React.useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      if (index >= 0 && index < historyRef.current.length) {
        const imageData = historyRef.current[index];
        if (imageData) {
          if (
            canvas.width !== imageData.width ||
            canvas.height !== imageData.height
          ) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
          }
          ctx.putImageData(imageData, 0, 0);
          historyIndexRef.current = index;
          updateHistoryButtons();
        }
      }
    },
    [updateHistoryButtons]
  );

  const undo = React.useCallback(() => {
    if (historyIndexRef.current > 0 && historyRef.current.length > 0) {
      const newIndex = historyIndexRef.current - 1;
      restoreState(newIndex);
    }
  }, [restoreState]);

  const redo = React.useCallback(() => {
    if (
      historyIndexRef.current < historyRef.current.length - 1 &&
      historyRef.current.length > 0
    ) {
      const newIndex = historyIndexRef.current + 1;
      restoreState(newIndex);
    }
  }, [restoreState]);

  const getPointFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
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

        const pointSize = size * (0.6 + Math.random() * 0.4);
        const radius = pointSize / 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
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
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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
          const steps = Math.max(
            3,
            Math.floor(
              Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) +
                  Math.pow(point.y - prevPoint.y, 2)
              ) /
                (brushSize / 2)
            )
          );

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
          const radius = ctx.lineWidth / 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [tool, brushSize, brushColor, multiPointEnabled, drawMultiPoint]
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
      if (setDraggingClosetId) setDraggingClosetId(null);
      if (setDraggingPlacedId) setDraggingPlacedId(null);

      const point = getPointFromEvent(e);
      if (!point) return;

      setIsDrawing(true);
      prevPointRef.current = null;
      hasStartedDrawingRef.current = false;

      if (!hasStartedDrawingRef.current) {
        saveState();
        hasStartedDrawingRef.current = true;
      }

      draw(point, null);
      prevPointRef.current = point;
    },
    [draw, saveState, setDraggingClosetId, setDraggingPlacedId]
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragPos({ x, y });
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
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;
        placeClosetItem(id, tab, dropX, dropY);
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
    "#FF6B6B", // Red
    "#FF9F43", // Orange
    "#Feca57", // Yellow
    "#48dbfb", // Blue
    "#ff9ff3", // Pink
    "#54a0ff", // Dark Blue
    "#5f27cd", // Purple
    "#000000", // Black
  ];

  const toolsPanel = (
    <>
      {/* Title / Hero */}
      <div className="art-tools-hero">
        <span className="hero-icon">🎨</span>
        <div className="hero-text">
          <span className="hero-title">Studio Tools</span>
          <span className="hero-subtitle">Let's create!</span>
        </div>
      </div>

      {/* Main Tool Toggle */}
      <div className="tool-selector-group">
        <button
          className={`big-tool-btn ${tool === "brush" ? "active" : ""}`}
          onClick={() => setTool("brush")}
          title="Paint Brush"
        >
          <span className="big-tool-icon">✏️</span>
          <span className="big-tool-label">Draw</span>
        </button>
        <button
          className={`big-tool-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => setTool("eraser")}
          title="Eraser"
        >
          <span className="big-tool-icon">🧼</span>
          <span className="big-tool-label">Erase</span>
        </button>
      </div>

      {tool === "brush" && (
        <>
          {/* Size Slider */}
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

          {/* Colors */}
          <div className="control-card">
            <div className="card-header">Color Palette</div>
            <div className="palette-grid">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${brushColor === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setBrushColor(c)}
                  aria-label={`Select color ${c}`}
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

          {/* Magic Effect */}
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

      {/* History */}
      <div className="history-row">
        <button
          className="history-pill"
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          <span className="icon">↩️</span> Undo
        </button>
        <button
          className="history-pill"
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
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
          ref={canvasContainerRef}
          onDragOver={handleDragOverCanvas}
          onDrop={handleDropOnCanvas}
          onDragLeave={handleDragLeaveCanvas}
        >
          <AvatarCanvas
            gender={gender}
            tab={tab}
            size={300}
            offsetY={0}
            placed={placed}
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
            ref={canvasRef}
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
