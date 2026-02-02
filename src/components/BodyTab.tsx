import { Closet } from "./Closet";
import { AvatarCanvas } from "./AvatarCanvas";
import type { SharedTabProps } from "../types";

export function BodyTab(props: SharedTabProps) {
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

  // closet is already filtered by tab in AvatarStudio
  const typeOptions = [
    ...Array.from(
      new Set(closet.map((item) => item.type).filter(Boolean) as string[])
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
          filterOptions={typeOptions}
          filterByOccupation={false}
        >
          {genderSelector}
        </Closet>
      </div>
    </div>
  );
}
