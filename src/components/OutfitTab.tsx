import React from "react";
import type { ClosetItem, Gender, PlacedItem, TabKey } from "../types";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";

interface OutfitTabProps {
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
  setDraggingPlacedId: (iid: string | null) => void;
  setIsHoveringTrash: (b: boolean) => void;
  isHoveringTrash: boolean;
  removePlacedByInstanceId: (iid: string) => void;

  // FIX: Add canvasRef prop
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function OutfitTab(props: OutfitTabProps) {
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
    canvasRef, // FIX: Destructure canvasRef
  } = props;

  const closetItems = closet.filter((item) => item.tab === "outfit");

  // DETECT STRATEGY: Do any items here have an occupation?
  const hasOccupation = closetItems.some((item) => !!item.occupation);

  let filterOptions: string[] = [];

  if (hasOccupation) {
    // Strategy A: Filter by Occupation
    filterOptions = [
      ...Array.from(
        new Set(
          closetItems.map((i) => i.occupation).filter(Boolean) as string[]
        )
      ),
    ];
  } else {
    // Strategy B: Filter by Type (Fallback)
    filterOptions = [
      "all",
      ...Array.from(
        new Set(closetItems.map((i) => i.type).filter(Boolean) as string[])
      ),
    ];
  }

  return (
    <div className="studioBody">
      {/* FIX: Attach canvasRef here */}
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
          items={closetItems}
          avatarGender={gender}
          tab="outfit"
          onStartDrag={(id) => {
            setDraggingClosetId(id);
            setDragPos(null);
          }}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
          filterOptions={filterOptions}
          filterByOccupation={hasOccupation} // Tell Closet which logic to use
        />
      </div>
    </div>
  );
}
