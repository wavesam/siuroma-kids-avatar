import type { PlacedItem, Gender } from "../types";
import boyAvatar from "../assets/boy body.png";

function AvatarImage({
  gender,
  width,
  height,
}: {
  gender: Gender;
  width: number;
  height: number;
}) {
  const src =
    gender === "male"
      ? boyAvatar
      : "https://placehold.co/380x520/png?text=Girl+Avatar";
  return (
    <img
      src={src}
      alt={`${gender} avatar`}
      className="avatarSvg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: "contain",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

export function AvatarCanvas({
  gender,
  width,
  height,
  placed,
}: {
  gender: Gender;
  width: number;
  height: number;
  placed: PlacedItem[];
}) {
  // Canvas fills parent; the 'stage' is centered and sized like avatar

  return (
    <div
      className="avatarCanvas"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <div
        className="avatarStage"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: "none",
        }}
      >
        <AvatarImage gender={gender} width={width} height={height} />
        {/* Placed items positioned RELATIVE to avatarStage */}
        {placed.length > 0 && (
          <div
            key={placed[placed.length - 1].instanceId}
            className="placedItem"
            style={{
              left: `${placed[placed.length - 1].x}px`,
              top: `${placed[placed.length - 1].y}px`,
              width: `${placed[placed.length - 1].w}px`,
              height: `${placed[placed.length - 1].h}px`,
              zIndex: 2,
              opacity: 1,
              position: "absolute",
              pointerEvents: "none",
            }}
            title={placed[placed.length - 1].name}
          >
            <img
              src={placed[placed.length - 1].src}
              alt={placed[placed.length - 1].name}
              className="placedItemShell"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
