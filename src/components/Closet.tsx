import type { ClosetItem, Gender } from "../types";

const emptyImg = new Image();
emptyImg.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function Closet({
  items,
  avatarGender,
  onStartDrag,
  onEndDrag,
  occupationOptions,
  occupationFilter,
  setOccupationFilter,
}: {
  items: ClosetItem[];
  avatarGender: Gender;
  onStartDrag: (id: string) => void;
  onEndDrag: () => void;
  occupationOptions: string[];
  occupationFilter: string;
  setOccupationFilter: (filter: string) => void;
}) {
  // Filter items by gender before displaying
  const filteredItems = items.filter(
    (it) => !it.gender || it.gender === "unisex" || it.gender === avatarGender
  );

  return (
    <div className="closet card">
      <h1>Closet</h1>
      <div
        className="hide-scrollbar"
        style={{
          minHeight: 47,
          paddingBottom: 12,
          display: "flex",
          gap: 6,
          overflow: "auto",
        }}
      >
        {occupationOptions.map((occ) => (
          <button
            type="button"
            key={occ}
            className={`closetTabButton${
              occupationFilter === occ ? " closetTabButton--active" : ""
            }`}
            style={{
              fontWeight: occupationFilter === occ ? "bold" : "normal",
            }}
            onClick={() => setOccupationFilter(occ)}
          >
            {occ === "all" ? "All" : occ.charAt(0).toUpperCase() + occ.slice(1)}
          </button>
        ))}
      </div>
      <div className="closetGrid">
        {filteredItems.map((it) => (
          <div
            key={it.id}
            className="closetItem"
            draggable
            onDragStart={(e) => {
              onStartDrag(it.id);
              e.dataTransfer.setDragImage(emptyImg, 0, 0);
              e.dataTransfer.setData("application/x-avatar-item-id", it.id);
              e.dataTransfer.setData("text/plain", it.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onDragEnd={() => onEndDrag()}
            title="Drag me"
          >
            <div className="closetPreview">
              <img
                src={it.src}
                alt={it.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div className="closetLabel">{it.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
