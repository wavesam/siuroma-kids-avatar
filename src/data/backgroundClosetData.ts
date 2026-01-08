import type { ClosetItem } from "../types";

import bgCityPark from "../assets/backgrounds/bg-city-park.png";

/**
 * Background closet items
 *
 * Image backgrounds:
 * 1) Put files in: src/assets/backgrounds/
 * 2) Import it:
 *    import myBg from "../assets/backgrounds/my-bg.png";
 * 3) Add an item with `src: myBg` (type is optional for backgrounds):
 *    {
 *      id: "bg-my-photo",
 *      name: "My photo",
 *      tab: "background",
 *      gender: "unisex",
 *      src: myBg,
 *    }
 *
 * Gradient/color backgrounds:
 * - Put any valid CSS background value into `color` (including gradients). [web:46][web:45]
 *
 * Constraints (per request):
 * - No `backgroundRepeat`
 * - No `backgroundSize`
 * - No `repeating-linear-gradient(...)`
 */
export const backgroundClosetData: ClosetItem[] = [
  {
    id: "bg-my-photo",
    name: "My photo",
    tab: "background",
    gender: "unisex",
    src: bgCityPark,
    color: "#ffffff",
  },
  // Solid colors
  {
    id: "bg-white",
    name: "White",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#ffffff",
  },
  {
    id: "bg-black",
    name: "Black",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#000000",
  },
  {
    id: "bg-slate",
    name: "Slate",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#0f172a",
  },
  {
    id: "bg-sky-blue",
    name: "Sky blue",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#93c5fd",
  },
  {
    id: "bg-mint",
    name: "Mint",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#a7f3d0",
  },
  {
    id: "bg-pink",
    name: "Pink",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#fbcfe8",
  },
  {
    id: "bg-lavender",
    name: "Lavender",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#e9d5ff",
  },
  {
    id: "bg-cream",
    name: "Cream",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "#fef3c7",
  },

  // Non-repeating gradients (OK)
  {
    id: "bg-sky-gradient",
    name: "Sky gradient",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "linear-gradient(180deg, #93c5fd 0%, #e0f2fe 60%, #ffffff 100%)",
  },
  {
    id: "bg-sunset-gradient",
    name: "Sunset gradient",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "linear-gradient(180deg, #fb7185 0%, #fdba74 45%, #fef3c7 100%)",
  },
  {
    id: "bg-ocean-gradient",
    name: "Ocean gradient",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "linear-gradient(180deg, #0ea5e9 0%, #2563eb 55%, #0f172a 100%)",
  },
  {
    id: "bg-aurora-gradient",
    name: "Aurora gradient",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "linear-gradient(135deg, #22c55e 0%, #06b6d4 45%, #6366f1 100%)",
  },
  {
    id: "bg-peach-gradient",
    name: "Peach gradient",
    tab: "background",
    gender: "unisex",
    src: "",
    color: "linear-gradient(135deg, #fed7aa 0%, #fbcfe8 55%, #e9d5ff 100%)",
  },
  {
    id: "bg-radial-soft-glow",
    name: "Soft glow",
    tab: "background",
    gender: "unisex",
    src: "",
    color:
      "radial-gradient(circle at 30% 25%, #ffffff 0%, #bfdbfe 45%, #1e3a8a 100%)",
  },
  {
    id: "bg-purple-haze",
    name: "Purple haze",
    tab: "background",
    gender: "unisex",
    src: "",
    color:
      "radial-gradient(circle at 20% 20%, rgba(192,132,252,0.85) 0%, transparent 45%), radial-gradient(circle at 75% 60%, rgba(147,197,253,0.75) 0%, transparent 40%), #0f172a",
  },

  // Image example (uncomment after adding an import):
  // {
  //   id: "bg-my-photo",
  //   name: "My photo",
  //   tab: "background",
  //   gender: "unisex",
  //   src: myBg,
  // },
];
