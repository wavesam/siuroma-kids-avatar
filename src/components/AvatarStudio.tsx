import React from "react";
import type { ClosetItem, Gender, PlacedItem } from "../types";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import { CLOSET, SNAP_POSITIONS } from "../closetData";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

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
      style={{ left: pos.x, top: pos.y, width: item.w, height: item.h }}
    >
      <img
        src={item.src}
        alt={item.name}
        className="dragGhostInner"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

function getSnappedPosition(
  item: ClosetItem,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const snapConfig = SNAP_POSITIONS[item.type || "accessory"];
  const sx = snapConfig ? snapConfig.x : 0.5;
  const sy = snapConfig ? snapConfig.y : 0.5;
  const x = sx * canvasWidth - item.w / 2;
  const y = sy * canvasHeight - item.h / 2;
  return { x, y };
}

export function AvatarStudio({
  gender,
  onBack,
}: {
  gender: Gender;
  onBack: () => void;
}) {
  const [placed, setPlaced] = React.useState<PlacedItem[]>([]);
  const [topZ, setTopZ] = React.useState(1);
  const [draggingClosetId, setDraggingClosetId] = React.useState<string | null>(
    null
  );
  const [dragPos, setDragPos] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [occupationFilter, setOccupationFilter] = React.useState<string>("all");

  const draggingClosetIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    draggingClosetIdRef.current = draggingClosetId;
  }, [draggingClosetId]);

  // Global drag listener for the ghost image
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

  // Only ever ONE item, replace fully on drop
  const addPlaced = (item: ClosetItem, x: number, y: number) => {
    setPlaced([
      { ...item, instanceId: crypto.randomUUID(), x, y, z: topZ + 1 },
    ]);
    setTopZ((z) => z + 1);
  };

  const previewItem = draggingClosetId
    ? CLOSET.find((c) => c.id === draggingClosetId) ?? null
    : null;

  const occupationOptions = [
    "all",
    ...Array.from(new Set(CLOSET.map((i) => i.occupation ?? "other"))),
  ];

  // FILTER closet items by gender!
  const filteredCloset =
    occupationFilter === "all"
      ? CLOSET.filter(
          (item) =>
            !item.gender || item.gender === gender || item.gender === "unisex"
        )
      : CLOSET.filter(
          (item) =>
            (item.occupation ?? "other") === occupationFilter &&
            (!item.gender || item.gender === gender || item.gender === "unisex")
        );

  const handleDropOnStage = (e: React.DragEvent) => {
    e.preventDefault();
    const id =
      e.dataTransfer.getData("application/x-avatar-item-id") ||
      e.dataTransfer.getData("text/plain");
    const item = CLOSET.find((c) => c.id === id);
    if (!item) return;
    const snappedPos = getSnappedPosition(item, CANVAS_WIDTH, CANVAS_HEIGHT);
    addPlaced(item, snappedPos.x, snappedPos.y);
  };

  return (
    <div className="studio">
      <div className="studioTopBar">
        <button onClick={onBack}>Back</button>
      </div>
      <div className="studioBody">
        <div
          className="left"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnStage}
        >
          <AvatarCanvas
            gender={gender}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            placed={placed}
          />
        </div>
        <div className="right">
          <Closet
            items={filteredCloset}
            avatarGender={gender}
            onStartDrag={(id) => {
              setDraggingClosetId(id);
              setDragPos(null);
            }}
            onEndDrag={() => {
              setDraggingClosetId(null);
              setDragPos(null);
            }}
            occupationOptions={occupationOptions}
            occupationFilter={occupationFilter}
            setOccupationFilter={setOccupationFilter}
          />
        </div>
      </div>
      <DragGhost item={previewItem} pos={dragPos} />
    </div>
  );
}
