import type { ClosetItem } from "../types";

// Boys Only Imports
import boySinger from "../assets/boys only/outfit/singer_m.png";
import boyYoutuber from "../assets/boys only/outfit/youtuber_男.png";
import boyYoutuberHeadphone from "../assets/boys only/outfit/youtuber_男_headphone.png";
import boyFashionDesigner from "../assets/boys only/outfit/服裝設計師_男.png";
import boyTeacher from "../assets/boys only/outfit/老師_男.png";
import boyPilot from "../assets/boys only/outfit/飛機師_男.png";

// Girls Only Imports
import girlSinger from "../assets/girls only/outfit/singer_w.png";
import girlYoutuber from "../assets/girls only/outfit/youtuber_女.png";
import girlYoutuberHeadphone from "../assets/girls only/outfit/youtuber_女_headphone.png";
import girlFashionDesigner from "../assets/girls only/outfit/服裝設計師_女.png";
import girlTeacher from "../assets/girls only/outfit/老師_女.png";
import girlPilot from "../assets/girls only/outfit/飛機師_女.png";

export const outfitClosetData: ClosetItem[] = [
  // Boys Outfits
  {
    id: "boySinger",
    name: "Singer Outfit (Male)",
    type: "shirt",
    src: boySinger,
    gender: "male",
    tab: "outfit",
    occupation: "singer",
  },
  {
    id: "boyYoutuber",
    name: "YouTuber Outfit (Male)",
    type: "shirt",
    src: boyYoutuber,
    gender: "male",
    tab: "outfit",
    occupation: "youtuber",
  },
  {
    id: "boyYoutuberHeadphone",
    name: "Headphones (Male)",
    type: "hat",
    src: boyYoutuberHeadphone,
    gender: "male",
    tab: "outfit",
    occupation: "youtuber",
  },
  {
    id: "boyFashionDesigner",
    name: "Fashion Designer (Male)",
    type: "shirt",
    src: boyFashionDesigner,
    gender: "male",
    tab: "outfit",
    occupation: "fashion",
  },
  {
    id: "boyTeacher",
    name: "Teacher (Male)",
    type: "shirt",
    src: boyTeacher,
    gender: "male",
    tab: "outfit",
    occupation: "teacher",
  },
  {
    id: "boyPilot",
    name: "Pilot (Male)",
    type: "jacket",
    src: boyPilot,
    gender: "male",
    tab: "outfit",
    occupation: "pilot",
  },
  // Girls Outfits
  {
    id: "girlSinger",
    name: "Singer Outfit (Female)",
    type: "shirt",
    src: girlSinger,
    gender: "female",
    tab: "outfit",
    occupation: "singer",
  },
  {
    id: "girlYoutuber",
    name: "YouTuber Outfit (Female)",
    type: "shirt",
    src: girlYoutuber,
    gender: "female",
    tab: "outfit",
    occupation: "youtuber",
  },
  {
    id: "girlYoutuberHeadphone",
    name: "Headphones (Female)",
    type: "hat",
    src: girlYoutuberHeadphone,
    gender: "female",
    tab: "outfit",
    occupation: "youtuber",
  },
  {
    id: "girlFashionDesigner",
    name: "Fashion Designer (Female)",
    type: "shirt",
    src: girlFashionDesigner,
    gender: "female",
    tab: "outfit",
    occupation: "fashion",
  },
  {
    id: "girlTeacher",
    name: "Teacher (Female)",
    type: "shirt",
    src: girlTeacher,
    gender: "female",
    tab: "outfit",
    occupation: "teacher",
  },
  {
    id: "girlPilot",
    name: "Pilot (Female)",
    type: "jacket",
    src: girlPilot,
    gender: "female",
    tab: "outfit",
    occupation: "pilot",
  },
];
