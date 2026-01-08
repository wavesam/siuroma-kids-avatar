import React from "react";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import type { ClosetItem, PlacedItem, Gender, TabKey } from "../types";

interface BodyTabProps {
  gender: Gender;
  tab: TabKey;
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
  setDraggingPlacedId: (id: string | null) => void;
  draggingPlacedId: string | null;
  removePlacedByInstanceId: (iid: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function BodyTab(props: BodyTabProps) {
  const {
    gender,
    tab,
    placed,
    setGender,
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

  const closetItems = closet.filter((item) => item.tab === "body");

  const typeOptions = [
    ...Array.from(
      new Set(closetItems.map((item) => item.type).filter(Boolean) as string[])
    ),
  ];

  const genderSelector = (
    <div>
      <span>Select Your Gender:</span>
      <label htmlFor="gender-male">
        <input
          type="radio"
          id="gender-male"
          name="gender"
          value="male"
          checked={gender === "male"}
          onChange={() => setGender("male")}
        />
        Male
      </label>{" "}
      <label htmlFor="gender-female">
        <input
          type="radio"
          id="gender-female"
          name="gender"
          value="female"
          checked={gender === "female"}
          onChange={() => setGender("female")}
        />
        Female
      </label>
    </div>
  );

  return (
    <div className="studioBody">
      <div
        className="left"
        style={{ position: "relative", zIndex: 50 }}
        ref={canvasRef} // FIX: Attached ref here instead of to AvatarCanvas
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
          tab="body"
          onStartDrag={(id) => {
            setDraggingClosetId(id);
            setDragPos(null);
          }}
          onEndDrag={() => {
            setDraggingClosetId(null);
            setDragPos(null);
          }}
          filterOptions={typeOptions}
          filterByOccupation={false}
        >
          {genderSelector}
        </Closet>
      </div>
    </div>
  );
}
