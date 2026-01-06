import React from "react";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import type { ClosetItem, PlacedItem, Gender, TabKey } from "../types";

interface AccessoriesTabProps {
  gender: Gender;
  tab: TabKey; // current tab (passed from AvatarStudio)
  placed: PlacedItem[];
  setGender: (gender: Gender) => void;
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
  showTrash: boolean;
  removePlacedByClosetId: (closetId: string) => void;
  setIsHoveringTrash: (b: boolean) => void;
  isHoveringTrash: boolean;
  setDraggingPlacedId: (iid: string | null) => void;
  draggingPlacedId: string | null;

  // needed so mouse-drag-to-trash deletes placed items
  removePlacedByInstanceId: (iid: string) => void;
}

export function AccessoriesTab(props: AccessoriesTabProps) {
  const {
    gender,
    tab,
    placed,
    setPlaced,
    setDraggingClosetId,
    setDragPos,
    closet,
    canvasWidth,
    canvasHeight,
    placeClosetItem,
    snapItems,
    setDraggingPlacedId,
    setIsHoveringTrash,
    isHoveringTrash,
    removePlacedByInstanceId,
  } = props;

  const filteredCloset = closet.filter((item) => item.tab === "accessories");

  return (
    <div className="studioBody">
      <div
        className="left"
        style={{
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* IMPORTANT: no onDrop here -> AvatarCanvas is the only drop target to prevent duplicates */}
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
      </div>

      <div
        className="right"
        style={{
          position: "relative",
          zIndex: 10,
        }}
      >
        <Closet
          items={filteredCloset}
          avatarGender={gender}
          tab="accessories"
          onStartDrag={(id) => {
            setDraggingClosetId(id);
            setDragPos(null);
          }}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
          occupationOptions={[
            "all",
            ...(Array.from(
              new Set(filteredCloset.map((item) => item.occupation ?? "other"))
            ) as string[]),
          ]}
        />
      </div>
    </div>
  );
}
