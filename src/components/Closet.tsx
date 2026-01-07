import type { ClosetItem, Gender, TabKey } from "../types";
import { useState, type ReactNode } from "react";

const emptyImg = new Image();
emptyImg.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const OCC_IMAGES: Record<string, string> = {
  all: "https://api.iconify.design/ic:round-category.svg?color=%23cfe1ef",
  doctor: "https://api.iconify.design/healthicons:doctor.svg",
  chef: "https://api.iconify.design/fluent-emoji-flat:chef.svg",
  police: "https://api.iconify.design/fluent-emoji-flat:police-officer.svg",
  artist: "https://api.iconify.design/fluent-emoji-flat:artist.svg",
  fashion: "https://api.iconify.design/fluent-emoji-flat:t-shirt.svg",
};

export function Closet({
  items,
  avatarGender,
  tab,
  onStartDrag,
  onEndDrag,
  occupationOptions,
  children,
}: {
  items: ClosetItem[];
  avatarGender: Gender;
  tab: TabKey;
  onStartDrag: (id: string) => void;
  onEndDrag: () => void;
  occupationOptions?: string[];
  children?: ReactNode;
}) {
  const hasOccupations = !!(occupationOptions && occupationOptions.length > 0);
  const [selectedOcc, setSelectedOcc] = useState<string | null>(
    hasOccupations ? null : "all"
  );

  const pretty = (s: string) =>
    s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);

  if (hasOccupations && !selectedOcc) {
    return (
      <div className="closet card">
        {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
        <div className="closetGrid">
          {occupationOptions!.map((occ) => (
            <div
              className="closetItem"
              key={occ}
              style={{ cursor: "pointer", borderStyle: "solid" }}
              onClick={() => setSelectedOcc(occ)}
              tabIndex={0}
              role="button"
            >
              <div className="closetPreview">
                <img
                  src={OCC_IMAGES[occ] ?? OCC_IMAGES.all}
                  alt={occ}
                  style={{
                    width: "80%",
                    height: "80%",
                    objectFit: "contain",
                    pointerEvents: "none",
                    opacity: 0.83,
                  }}
                />
              </div>
              <div className="closetLabel" style={{ fontSize: 16 }}>
                {pretty(occ)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredItems = items.filter((it) => {
    const genderOk =
      !it.gender || it.gender === "unisex" || it.gender === avatarGender;

    const occupationOk =
      !hasOccupations || selectedOcc === "all" || it.occupation === selectedOcc;

    return genderOk && occupationOk;
  });

  return (
    <div className="closet card">
      {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
      {hasOccupations && (
        <button onClick={() => setSelectedOcc(null)}>← Back</button>
      )}
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
            onDragEnd={onEndDrag}
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
