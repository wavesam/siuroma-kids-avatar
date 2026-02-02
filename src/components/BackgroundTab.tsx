import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import type { SharedTabProps } from "../types";

export function BackgroundTab(props: SharedTabProps) {
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

  // closet is already filtered by tab in AvatarStudio

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
        />
      </div>

      <div className="right" style={{ position: "relative", zIndex: 10 }}>
        <Closet
          items={closet}
          avatarGender={gender}
          tab={tab}
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
