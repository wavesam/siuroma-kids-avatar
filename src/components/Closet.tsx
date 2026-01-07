import type { ClosetItem, Gender, TabKey } from "../types";
import { useState, type ReactNode } from "react";

const emptyImg = new Image();
emptyImg.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Updated to map from Item Types to icons
const TYPE_IMAGES: Record<string, string> = {
  all: "https://api.iconify.design/ic:round-category.svg?color=%23cfe1ef",
  // Body types
  hair: "https://api.iconify.design/fluent-emoji-flat:person-red-hair.svg",
  eyes: "https://api.iconify.design/fluent-emoji-flat:eye.svg",
  // Outfit types
  shirt: "https://api.iconify.design/fluent-emoji-flat:t-shirt.svg",
  pants: "https://api.iconify.design/fluent-emoji-flat:jeans.svg",
  shoes: "https://api.iconify.design/fluent-emoji-flat:running-shoe.svg",
  hat: "https://api.iconify.design/fluent-emoji-flat:womans-hat.svg",
  glasses: "https://api.iconify.design/fluent-emoji-flat:glasses.svg",
  jacket: "https://api.iconify.design/fluent-emoji-flat:coat.svg",
  accessory: "https://api.iconify.design/fluent-emoji-flat:gem-stone.svg",
  // Fallbacks
  other: "https://api.iconify.design/fluent-emoji-flat:package.svg",
};

export function Closet({
  items,
  avatarGender,
  onStartDrag,
  onEndDrag,
  categoryOptions,
  children,
}: {
  items: ClosetItem[];
  avatarGender: Gender;
  tab: TabKey;
  onStartDrag: (id: string) => void;
  onEndDrag: () => void;
  categoryOptions?: string[];
  children?: ReactNode;
}) {
  const hasCategories = !!(categoryOptions && categoryOptions.length > 0);
  const [selectedType, setSelectedType] = useState<string | null>(
    hasCategories ? null : "all"
  );

  const pretty = (s: string) =>
    s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);

  // If we have categories (types) to show and haven't picked one yet
  if (hasCategories && !selectedType) {
    return (
      <div className="closet card">
        {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
        <div className="closetGrid">
          {categoryOptions!.map((typeKey) => (
            <div
              className="closetItem"
              key={typeKey}
              style={{ cursor: "pointer", borderStyle: "solid" }}
              onClick={() => setSelectedType(typeKey)}
              tabIndex={0}
              role="button"
            >
              <div className="closetPreview">
                <img
                  src={TYPE_IMAGES[typeKey] ?? TYPE_IMAGES.other}
                  alt={typeKey}
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
                {pretty(typeKey)}
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

    // Filter by TYPE now, not category
    const typeOk =
      !hasCategories || selectedType === "all" || it.type === selectedType;

    return genderOk && typeOk;
  });

  return (
    <div className="closet card">
      {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
      {hasCategories && (
        <button onClick={() => setSelectedType(null)}>← Back</button>
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
