import type { ClosetItem, Gender, TabKey } from "../types";
import { useState, type ReactNode } from "react";
import { getOccupationCoverImage } from "../data/occupationCoverImages";

const emptyImg = new Image();
emptyImg.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Mappings for BOTH types and occupations
const ICON_MAPPINGS: Record<string, string> = {
  all: "https://api.iconify.design/ic:round-category.svg?color=%23cfe1ef",

  // Occupations
  singer: "https://api.iconify.design/fluent-emoji-flat:microphone.svg",
  youtuber: "https://api.iconify.design/fluent-emoji-flat:video-camera.svg",
  fashion: "https://api.iconify.design/fluent-emoji-flat:thread.svg",
  teacher: "https://api.iconify.design/fluent-emoji-flat:books.svg",
  pilot: "https://api.iconify.design/fluent-emoji-flat:airplane.svg",
  doctor: "https://api.iconify.design/healthicons:doctor.svg",
  chef: "https://api.iconify.design/fluent-emoji-flat:chef.svg",
  police: "https://api.iconify.design/fluent-emoji-flat:police-officer.svg",
  artist: "https://api.iconify.design/fluent-emoji-flat:artist.svg",
  astronaut: "https://api.iconify.design/fluent-emoji-flat:rocket.svg",
  dentist: "https://api.iconify.design/fluent-emoji-flat:tooth.svg",
  fireman: "https://api.iconify.design/fluent-emoji-flat:fire.svg",
  musician: "https://api.iconify.design/fluent-emoji-flat:musical-note.svg",
  nurse: "https://api.iconify.design/fluent-emoji-flat:health-worker.svg",
  veterinarian: "https://api.iconify.design/fluent-emoji-flat:dog-face.svg",

  // Types
  hair: "https://api.iconify.design/fluent-emoji-flat:person-red-hair.svg",
  eyes: "https://api.iconify.design/fluent-emoji-flat:eye.svg",
  shirt: "https://api.iconify.design/fluent-emoji-flat:t-shirt.svg",
  pants: "https://api.iconify.design/fluent-emoji-flat:jeans.svg",
  shoes: "https://api.iconify.design/fluent-emoji-flat:running-shoe.svg",
  hat: "https://api.iconify.design/fluent-emoji-flat:womans-hat.svg",
  glasses: "https://api.iconify.design/fluent-emoji-flat:glasses.svg",
  jacket: "https://api.iconify.design/fluent-emoji-flat:coat.svg",
  accessory: "https://api.iconify.design/fluent-emoji-flat:gem-stone.svg",

  // Fallback
  other: "https://api.iconify.design/fluent-emoji-flat:package.svg",
};

function isBackgroundItem(it: ClosetItem) {
  return it.tab === "background";
}

function getBackgroundPreviewStyle(it: ClosetItem) {
  // Background items can be:
  // - image backgrounds: it.src
  // - gradient/solid backgrounds: it.color (valid CSS background value)
  //
  // Use `background` shorthand so it supports colors + gradients. [web:16][web:46]
  const hasImage = typeof it.src === "string" && it.src.trim().length > 0;
  const bg = (it as any).color as string | undefined;

  if (hasImage) {
    return {
      backgroundImage: `url("${it.src}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    } as const;
  }

  if (bg && bg.trim().length > 0) {
    return {
      background: bg,
    } as const;
  }

  return {
    background: "#ffffff",
  } as const;
}

export function Closet({
  items,
  avatarGender,
  onStartDrag,
  onEndDrag,
  // Now generically named "filterOptions" instead of category/type
  filterOptions,
  // We pass a flag to know if we are filtering by occupation or type
  filterByOccupation = false,
  children,
}: {
  items: ClosetItem[];
  avatarGender: Gender;
  tab: TabKey;
  onStartDrag: (id: string) => void;
  onEndDrag: () => void;
  filterOptions?: string[];
  filterByOccupation?: boolean;
  children?: ReactNode;
}) {
  const hasFilters = !!(filterOptions && filterOptions.length > 0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(
    hasFilters ? null : "all"
  );

  const pretty = (s: string) =>
    s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);

  // 1. Render the Grid of Icons (Categories)
  if (hasFilters && !selectedFilter) {
    return (
      <div className="closet card">
        {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
        <div className="closetGrid">
          {filterOptions!.map((key) => {
            // If filtering by occupation, try to use gender-specific cover image
            const coverImage =
              filterByOccupation && key !== "all"
                ? getOccupationCoverImage(key, avatarGender)
                : undefined;

            const iconSrc = coverImage ?? ICON_MAPPINGS[key] ?? ICON_MAPPINGS.other;

            return (
              <div
                className="closetItem"
                key={key}
                style={{ cursor: "pointer", borderStyle: "solid" }}
                onClick={() => setSelectedFilter(key)}
                tabIndex={0}
                role="button"
              >
                <div className="closetPreview">
                  <img
                    src={iconSrc}
                    alt={key}
                    style={{
                      width: "80%",
                      height: "80%",
                      objectFit: coverImage ? "cover" : "contain",
                      pointerEvents: "none",
                      opacity: coverImage ? 1 : 0.83,
                    }}
                  />
                </div>
                <div className="closetLabel" style={{ fontSize: 16 }}>
                  {pretty(key)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Render the Items (Filtered)
  const filteredItems = items.filter((it) => {
    const genderOk =
      !it.gender || it.gender === "unisex" || it.gender === avatarGender;

    let filterOk = true;

    if (hasFilters && selectedFilter !== "all") {
      if (filterByOccupation) {
        // Strict match for occupation
        filterOk = it.occupation === selectedFilter;
      } else {
        // Strict match for type
        filterOk = it.type === selectedFilter;
      }
    }

    return genderOk && filterOk;
  });

  return (
    <div className="closet card">
      {children && <div style={{ marginBottom: "1em" }}>{children}</div>}
      {hasFilters && (
        <button onClick={() => setSelectedFilter(null)}>← Back</button>
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
              {isBackgroundItem(it) ? (
                <div
                  aria-label={it.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 6,
                    ...getBackgroundPreviewStyle(it),
                  }}
                />
              ) : (
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
              )}
            </div>
            <div className="closetLabel">{it.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
