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
  } = props;

  const closetItems = closet.filter((item) => item.tab === "body");

  const [occupationFilter] = React.useState<string>("all");
  const occupationOptions = [
    "all",
    ...(Array.from(
      new Set(closetItems.map((item) => item.occupation ?? "other"))
    ) as string[]),
  ];

  const filteredCloset =
    occupationFilter === "all"
      ? closetItems.filter(
          (item) =>
            !item.gender || item.gender === gender || item.gender === "unisex"
        )
      : closetItems.filter(
          (item) =>
            (item.occupation ?? "other") === occupationFilter &&
            (!item.gender || item.gender === gender || item.gender === "unisex")
        );

  const genderSelector = (
    <div>
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
      <div className="left" style={{ position: "relative", zIndex: 50 }}>
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
      <div className="right" style={{ position: "relative", zIndex: 10 }}>
        <Closet
          items={filteredCloset}
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
          occupationOptions={occupationOptions}
        >
          {genderSelector}
        </Closet>
      </div>
    </div>
  );
}
