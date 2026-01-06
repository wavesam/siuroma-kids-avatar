import React from "react";
import { AvatarCanvas } from "./AvatarCanvas";
import type { PlacedItem, Gender, TabKey, ClosetItem } from "../types";

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

  return (
    <div className="studioBody">
      <div className="left" style={{ position: "relative", zIndex: 50 }}>
        <AvatarCanvas
          gender={gender}
          tab={tab}
          width={canvasWidth}
          height={canvasHeight}
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
      </div>
    </div>
  );
}

