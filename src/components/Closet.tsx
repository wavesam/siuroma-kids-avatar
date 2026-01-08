import type { ClosetItem, Gender, TabKey } from "../types";
import { useState, type ReactNode } from "react";
import { getOccupationCoverImage } from "../data/occupationCoverImages";

const emptyImg = new Image();
emptyImg.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Mappings for BOTH types and occupations
const ICON_MAPPINGS: Record<string, string> = {
  other: "https://api.iconify.design/fluent-emoji-flat:package.svg",
};

function isBackgroundItem(it: ClosetItem) {
  return it.tab === "background";
}

function getBackgroundPreviewStyle(it: ClosetItem) {
  // 1. Check if we have a valid image source
  const hasImage =
    it.src && typeof it.src === "string" && it.src.trim().length > 0;

  // 2. Check if we have a valid color/gradient
  // We cast to any because 'color' might not be on the base ClosetItem type strictly
  const bg = (it as any).color as string | undefined;
  const hasColor = bg && bg.trim().length > 0;

  // If we have an image, prioritize it
  if (hasImage) {
    return {
      backgroundImage: `url("${it.src}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      // Fallback color behind image in case it takes time to load
      backgroundColor: hasColor ? bg : "#e2e8f0",
    } as const;
  }

  // If no image, use the color/gradient
  if (hasColor) {
    return {
      background: bg,
    } as const;
  }

  // Fallback if neither exists
  return {
    background: "#ffffff",
  } as const;
}

export function Closet({
  items,
  avatarGender,
  onStartDrag,
  onEndDrag,
  filterOptions,
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
            // Check for occupation cover image even if filtering by type
            const coverImage =
              key !== "all"
                ? getOccupationCoverImage(key, avatarGender)
                : undefined;

            const iconSrc =
              coverImage ?? ICON_MAPPINGS[key] ?? ICON_MAPPINGS.other;

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
        filterOk = it.occupation === selectedFilter;
      } else {
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
                    // Vital fix: ensures the div has height even if empty
                    aspectRatio: "1/1",
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
