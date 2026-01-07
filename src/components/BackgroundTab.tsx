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

type Wallpaper = {
  id: string;
  background: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
};

const WALLPAPERS: Wallpaper[] = [
  { id: "white", background: "#ffffff" },
  {
    id: "sky",
    background:
      "linear-gradient(180deg, #93c5fd 0%, #e0f2fe 60%, #ffffff 100%)",
    backgroundRepeat: "no-repeat",
  },
  {
    id: "rainbow",
    background:
      "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 25%, #fbc2eb 50%, #a18cd1 75%, #84fab0 100%)",
    backgroundRepeat: "no-repeat",
  },
  {
    id: "sunrise",
    background:
      "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fca5a5 100%)",
    backgroundRepeat: "no-repeat",
  },
  {
    id: "sunset",
    background:
      "linear-gradient(180deg, #c084fc 0%, #93c5fd 50%, #0f172a 100%)",
    backgroundRepeat: "no-repeat",
  },
  {
    id: "grass",
    background:
      "repeating-linear-gradient(90deg, #86efac 0 24px, #4ade80 24px 48px)",
  },
  {
    id: "ocean",
    background:
      "repeating-radial-gradient(circle at 20% 20%, #bfdbfe 0 12px, transparent 12px 24px), linear-gradient(180deg, #0ea5e9 0%, #2563eb 100%)",
    backgroundSize: "64px 64px",
    backgroundRepeat: "repeat",
  },
  {
    id: "dots",
    background: "radial-gradient(#60a5fa 10%, transparent 11%)",
    backgroundSize: "32px 32px",
    backgroundRepeat: "repeat",
  },
  {
    id: "confetti",
    background:
      "repeating-linear-gradient(45deg, #f472b6 0 10px, #34d399 10px 20px, #fcd34d 20px 30px, #60a5fa 30px 40px)",
    backgroundSize: "56px 56px",
  },
  {
    id: "checker",
    background:
      "repeating-linear-gradient(45deg, #ecfeff 0 16px, #a5f3fc 16px 32px)",
    backgroundSize: "32px 32px",
  },
  {
    id: "grid",
    background:
      "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    backgroundRepeat: "repeat",
  },
  {
    id: "lego",
    background:
      "repeating-linear-gradient(0deg, #fca5a5 0 24px, #f97316 24px 48px)",
    backgroundRepeat: "repeat",
  },
  {
    id: "candy",
    background:
      "repeating-linear-gradient(135deg, #fef3c7 0 12px, #fca5a5 12px 24px, #c084fc 24px 36px)",
    backgroundSize: "48px 48px",
  },
  {
    id: "bubbles",
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0 12px, transparent 12px 32px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.65) 0 10px, transparent 10px 28px)",
    backgroundSize: "72px 72px",
    backgroundRepeat: "repeat",
  },
  {
    id: "night",
    background:
      "radial-gradient(#fef9c3 1px, transparent 1px), radial-gradient(#fde68a 1px, transparent 1px), #0f172a",
    backgroundSize: "48px 48px, 32px 32px, auto",
    backgroundRepeat: "repeat",
  },
  {
    id: "paper",
    background:
      "repeating-linear-gradient(0deg, #f8fafc 0 16px, #e2e8f0 16px 17px)",
    backgroundRepeat: "repeat",
  },
  {
    id: "mint",
    background: "linear-gradient(180deg, #ecfeff 0%, #a5f3fc 100%)",
    backgroundRepeat: "no-repeat",
  },
  {
    id: "purple-haze",
    background:
      "radial-gradient(circle at 20% 20%, #c084fc 0%, transparent 35%), radial-gradient(circle at 70% 60%, #93c5fd 0%, transparent 30%), #0f172a",
    backgroundRepeat: "repeat",
  },
];

export function BackgroundTab(props: BackgroundTabProps) {
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
    canvasRef,
  } = props;

  const filteredCloset = closet.filter((item) => item.tab === "background");

  const currentBackground = placed.find((p) => p.tab === "background");

  const setWallpaperBackground = (wallpaper: Wallpaper) => {
    const instanceId = crypto.randomUUID();
    setPlaced((prev) => [
      ...prev.filter((p) => p.tab !== "background"),
      {
        id: `bg-${wallpaper.id}`,
        name: `Background ${wallpaper.id}`,
        tab: "background",
        instanceId,
        src: "",
        type: "body",
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        z: 0,
        size: canvasWidth,
        color: wallpaper.background,
        backgroundSize: wallpaper.backgroundSize,
        backgroundRepeat: wallpaper.backgroundRepeat,
      },
    ]);
  };

  const wallpaperPicker = (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {WALLPAPERS.map((wp) => {
          const isActive = currentBackground?.color === wp.background;
          return (
            <button
              key={wp.id}
              onClick={() => setWallpaperBackground(wp)}
              type="button"
              aria-pressed={isActive}
              style={{
                padding: 0,
                border: isActive ? "2px solid #0f172a" : "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 2px 8px rgba(15, 23, 42, 0.16)"
                  : "0 1px 4px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
                aspectRatio: "3 / 2",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: wp.background,
                  backgroundSize: wp.backgroundSize ?? "auto",
                  backgroundRepeat: wp.backgroundRepeat ?? "repeat",
                }}
              />
            </button>
          );
        })}
      </div>
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
        >
          {wallpaperPicker}
        </Closet>
      </div>
    </div>
  );
}
