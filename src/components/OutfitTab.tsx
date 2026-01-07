import React from "react";
import type { ClosetItem, Gender, PlacedItem, TabKey } from "../types";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";

interface OutfitTabProps {
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

  // added for consistent behavior / trash delete of placed items
  snapItems: boolean;
  setDraggingPlacedId: (iid: string | null) => void;
  setIsHoveringTrash: (b: boolean) => void;
  isHoveringTrash: boolean;
  removePlacedByInstanceId: (iid: string) => void;
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
  } = props;

  // Outfit items only
  const closetItems = closet.filter((item) => item.tab === "outfit");

  // Filter based on TYPE now
  const [typeFilter] = React.useState<string>("all");

  const typeOptions = [
    "all",
    ...(Array.from(
      new Set(closetItems.map((item) => item.type ?? "other"))
    ) as string[]),
  ];

  const filteredCloset =
    typeFilter === "all"
      ? closetItems.filter(
          (item) =>
            !item.gender || item.gender === gender || item.gender === "unisex"
        )
      : closetItems.filter(
          (item) =>
            (item.type ?? "other") === typeFilter &&
            (!item.gender || item.gender === gender || item.gender === "unisex")
        );

  return (
    <div className="studioBody">
      <div
        className="left"
        style={{
          position: "relative",
          zIndex: 50, // keep avatar/placed above closet column
        }}
      >
        <AvatarCanvas
          gender={gender}
          tab={tab}
          placed={placed}
          setPlaced={setPlaced}
          freelyDraggable={!snapItems}
          setDraggingPlacedId={setDraggingPlacedId}
          setIsHoveringTrash={setIsHoveringTrash}
          isHoveringTrash={isHoveringTrash}
          removePlacedByInstanceId={removePlacedByInstanceId}
          placeClosetItem={placeClosetItem}
          snapItems={snapItems}
          size={300}
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
          tab="outfit"
          onStartDrag={(id) => {
            setDraggingClosetId(id);
            setDragPos(null);
          }}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
          // Passing type options to the Closet component
          categoryOptions={typeOptions}
        />
      </div>
    </div>
  );
}
