import React from "react";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import type { ClosetItem, PlacedItem, Gender, TabKey } from "../types";

interface BackgroundTabProps {
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
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function BackgroundTab(props: BackgroundTabProps) {
  const {
    gender,
    tab,
    placed,
    setPlaced,
    setDraggingClosetId,
    setDragPos,
    closet,
    placeClosetItem,
    snapItems,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
    canvasRef,
  } = props;

  // Background options now come purely from data (backgroundClosetData via closetData.ts)
  const filteredCloset = closet.filter((item) => item.tab === "background");

  return (
    <div className="studioBody">
      <div
        className="left"
        style={{ position: "relative", zIndex: 50 }}
        ref={canvasRef}
      >
        <AvatarCanvas
          gender={gender}
          tab={tab}
          placed={placed}
          setPlaced={setPlaced}
          setDraggingPlacedId={setDraggingPlacedId}
          setIsHoveringTrash={setIsHoveringTrash}
          isHoveringTrash={isHoveringTrash}
          removePlacedByInstanceId={removePlacedByInstanceId}
          placeClosetItem={placeClosetItem}
          snapItems={snapItems}
          size={300}
        />
      </div>

      <div className="right" style={{ position: "relative", zIndex: 10 }}>
        <Closet
          items={filteredCloset}
          avatarGender={gender}
          tab="background"
          onStartDrag={(id) => {
            setDraggingClosetId(id);
            setDragPos(null);
          }}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
        />
      </div>
    </div>
  );
}
