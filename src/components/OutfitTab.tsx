import type { SharedTabProps } from "../types";
import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";

export function OutfitTab(props: SharedTabProps) {
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
  // DETECT STRATEGY: Do any items here have an occupation?
  const hasOccupation = closet.some((item) => !!item.occupation);

  let filterOptions: string[] = [];

  if (hasOccupation) {
    // Strategy A: Filter by Occupation
    filterOptions = [
      ...Array.from(
        new Set(closet.map((i) => i.occupation).filter(Boolean) as string[])
      ),
    ];
  } else {
    // Strategy B: Filter by Type (Fallback)
    filterOptions = [
      "all",
      ...Array.from(
        new Set(closet.map((i) => i.type).filter(Boolean) as string[])
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
          filterOptions={filterOptions}
          filterByOccupation={hasOccupation}
        />
      </div>
    </div>
  );
}
