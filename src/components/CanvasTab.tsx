import React from "react";
import { AvatarCanvas } from "./AvatarCanvas";
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
  } = props;

  const [tool, setTool] = React.useState<DrawingTool>("brush");
  const [brushSize, setBrushSize] = React.useState(10);
  const [brushColor, setBrushColor] = React.useState("#000000");
  const [multiPointEnabled, setMultiPointEnabled] = React.useState(false);
  const [multiPointCount, setMultiPointCount] = React.useState(5);
  const [multiPointSpread, setMultiPointSpread] = React.useState(10);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
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

    // Ensure canvas is initialized
    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    // Remove any states after current index (when doing new action after undo)
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    // Save current state
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(imageData);
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history size to prevent memory issues
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

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Only resize if dimensions changed
    const newWidth = rect.width * dpr;
    const newHeight = rect.height * dpr;
    
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // Save current content before resize if there's existing content
      const hasExistingContent = canvas.width > 0 && canvas.height > 0;
      let imageData: ImageData | null = null;
      
      if (hasExistingContent && historyRef.current.length > 0) {
        // Get current content from canvas
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error("Error saving canvas content before resize:", error);
        }
      }
      
      // Update canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.scale(dpr, dpr);
      
      // Restore content if it existed, otherwise clear
      if (imageData) {
        // Resize the image data to match new canvas size if needed
        if (imageData.width !== rect.width * dpr || imageData.height !== rect.height * dpr) {
          // Create temporary canvas to resize
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = imageData.width;
          tempCanvas.height = imageData.height;
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            // Draw scaled to new canvas
            ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
          }
        } else {
          ctx.putImageData(imageData, 0, 0);
        }
        // Save the resized state
        saveState();
      } else {
        // Only clear on first initialization
        ctx.clearRect(0, 0, rect.width, rect.height);
        // Save initial empty state only on first initialization
        if (historyRef.current.length === 0) {
          saveState();
        }
      }
    }
  }, [canvasWidth, canvasHeight, saveState]);

  const restoreState = React.useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (index >= 0 && index < historyRef.current.length) {
      const imageData = historyRef.current[index];
      if (imageData) {
        // Ensure canvas size matches the saved image data
        if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
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
  }, [updateHistoryButtons]);

  const undo = React.useCallback(() => {
    if (historyIndexRef.current > 0 && historyRef.current.length > 0) {
      const newIndex = historyIndexRef.current - 1;
      restoreState(newIndex);
    }
  }, [restoreState]);

  const redo = React.useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1 && historyRef.current.length > 0) {
      const newIndex = historyIndexRef.current + 1;
      restoreState(newIndex);
    }
  }, [restoreState]);

  const getPointFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const drawMultiPoint = React.useCallback((center: { x: number; y: number }, ctx: CanvasRenderingContext2D, size: number) => {
    // Draw multiple points around the center with random distribution
    for (let i = 0; i < multiPointCount; i++) {
      // Random angle and distance for each point
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * multiPointSpread;
      const x = center.x + Math.cos(angle) * distance;
      const y = center.y + Math.sin(angle) * distance;
      
      // Random size variation (60% to 100% of brush size)
      const pointSize = size * (0.6 + Math.random() * 0.4);
      const radius = pointSize / 2;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [multiPointCount, multiPointSpread]);

  const draw = React.useCallback((point: { x: number; y: number }, prevPoint: { x: number; y: number } | null) => {
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
      // Eraser mode
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = brushSize * 2; // Eraser is typically larger
    }

    // Multi-point brush effect
    if (multiPointEnabled && tool === "brush") {
      if (prevPoint) {
        // Draw a line with multiple points along it
        const steps = Math.max(3, Math.floor(Math.sqrt(
          Math.pow(point.x - prevPoint.x, 2) + 
          Math.pow(point.y - prevPoint.y, 2)
        ) / (brushSize / 2)));
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = prevPoint.x + (point.x - prevPoint.x) * t;
          const y = prevPoint.y + (point.y - prevPoint.y) * t;
          drawMultiPoint({ x, y }, ctx, brushSize);
        }
      } else {
        // Draw multiple points at the center
        drawMultiPoint(point, ctx, brushSize);
      }
    } else {
      // Regular brush or eraser
      if (prevPoint) {
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else {
        // Draw a point if no previous point
        const radius = ctx.lineWidth / 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        if (tool === "brush") {
          ctx.fill();
        } else {
          // For eraser, we need to fill to create the erase effect
          ctx.fill();
        }
      }
    }
  }, [tool, brushSize, brushColor, multiPointEnabled, drawMultiPoint]);

  const prevPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasStartedDrawingRef = React.useRef(false);

  const handleStart = React.useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (setDraggingClosetId) setDraggingClosetId(null);
    if (setDraggingPlacedId) setDraggingPlacedId(null);

    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    prevPointRef.current = null;
    hasStartedDrawingRef.current = false;
    
    // Save state before starting to draw (only once per stroke)
    if (!hasStartedDrawingRef.current) {
      saveState();
      hasStartedDrawingRef.current = true;
    }
    
    draw(point, null);
    prevPointRef.current = point;
  }, [draw, saveState, setDraggingClosetId, setDraggingPlacedId]);

  const handleMove = React.useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getPointFromEvent(e);
    if (!point) return;

    draw(point, prevPointRef.current);
    prevPointRef.current = point;
  }, [isDrawing, draw]);

  const handleEnd = React.useCallback(() => {
    if (isDrawing && hasStartedDrawingRef.current) {
      setIsDrawing(false);
      prevPointRef.current = null;
      hasStartedDrawingRef.current = false;
      // Save state after drawing is complete to capture the final stroke
      // This ensures undo/redo works correctly with completed strokes
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
  }, [isDrawing]);

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Cmd+Shift+Z or Ctrl+Shift+Z for redo
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

  return (
    <div className="studioBody">
      <div className="canvasDrawingSidebar">
        <div className="toolSection">
          <h3>Tools</h3>
          <div className="toolButtons">
            <button
              className={`toolButton ${tool === "brush" ? "active" : ""}`}
              onClick={() => setTool("brush")}
              title="Brush"
            >
              ✏️
            </button>
            <button
              className={`toolButton ${tool === "eraser" ? "active" : ""}`}
              onClick={() => setTool("eraser")}
              title="Eraser"
            >
              🧹
            </button>
          </div>
        </div>

        {tool === "brush" && (
          <div className="brushSettings">
            <label>
              <span>Brush Size: {brushSize}px</span>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </label>
            <label>
              <span>Color</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={multiPointEnabled}
                onChange={(e) => setMultiPointEnabled(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <span>Multi-Point Effect</span>
            </label>
            {multiPointEnabled && (
              <>
                <label>
                  <span>Point Count: {multiPointCount}</span>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={multiPointCount}
                    onChange={(e) => setMultiPointCount(Number(e.target.value))}
                  />
                </label>
                <label>
                  <span>Spread: {multiPointSpread}px</span>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={multiPointSpread}
                    onChange={(e) => setMultiPointSpread(Number(e.target.value))}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {tool === "eraser" && (
          <div className="brushSettings">
            <label>
              <span>Eraser Size: {brushSize * 2}px</span>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        <div className="historySection">
          <h3>History</h3>
          <div className="historyButtons">
            <button
              className="historyButton"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              className="historyButton"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
          </div>
        </div>
      </div>

      <div className="left" style={{ position: "relative", zIndex: 50 }}>
        <div className="canvasContainer">
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
    </div>
  );
}
