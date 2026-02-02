import type { ClosetItemDefinition } from "../types";

// Boys Only Imports
import boySinger from "../assets/boys only/outfit/singer_clothes_b.png";
import boyYoutuber from "../assets/boys only/outfit/youtuber_clothes_b.png";
import boyYoutuberHeadphone from "../assets/boys only/outfit/youtuber_headphones_b.png";
import boyFashionDesigner from "../assets/boys only/outfit/fashion_designer_clothes_b.png";
import boyTeacher from "../assets/boys only/outfit/teacher_clothes_b.png";
import boyPilot from "../assets/boys only/outfit/pilot_clothes_b.png";

// Girls Only Imports
import girlSinger from "../assets/girls only/outfit/singer_clothes_g.png";
import girlYoutuber from "../assets/girls only/outfit/youtuber_clothes_g.png";
import girlYoutuberHeadphone from "../assets/girls only/outfit/youtuber_headphones_g.png";
import girlFashionDesigner from "../assets/girls only/outfit/fashion_designer_clothes_g.png";
import girlTeacher from "../assets/girls only/outfit/teacher_clothes_g.png";
import girlPilot from "../assets/girls only/outfit/pilot_clothes_g.png";

export const outfitClosetData: ClosetItemDefinition[] = [
  // Boys Outfits
  {
    id: "boySinger",
    name: "Singer Outfit (Male)",
    type: "shirt",
    src: boySinger,
    gender: "male",
    occupation: "musician",
  },
  {
    id: "boyYoutuber",
    name: "YouTuber Outfit (Male)",
    type: "shirt",
    src: boyYoutuber,
    gender: "male",
    occupation: "youtuber",
  },
  {
    id: "boyYoutuberHeadphone",
    name: "Headphones (Male)",
    type: "hat",
    src: boyYoutuberHeadphone,
    gender: "male",
    occupation: "youtuber",
  },
  {
    id: "boyFashionDesigner",
    name: "Fashion Designer (Male)",
    type: "shirt",
    src: boyFashionDesigner,
    gender: "male",
    occupation: "fashion",
  },
  {
    id: "boyTeacher",
    name: "Teacher (Male)",
    type: "shirt",
    src: boyTeacher,
    gender: "male",
    occupation: "teacher",
  },
  {
    id: "boyPilot",
    name: "Pilot (Male)",
    type: "shirt",
    src: boyPilot,
    gender: "male",
    occupation: "pilot",
  },
  // Girls Outfits
  {
    id: "girlSinger",
    name: "Singer Outfit (Female)",
    type: "shirt",
    src: girlSinger,
    gender: "female",
    occupation: "musician",
  },
  {
    id: "girlYoutuber",
    name: "YouTuber Outfit (Female)",
    type: "shirt",
    src: girlYoutuber,
    gender: "female",
    occupation: "youtuber",
  },
  {
    id: "girlYoutuberHeadphone",
    name: "Headphones (Female)",
    type: "hat",
    src: girlYoutuberHeadphone,
    gender: "female",
    occupation: "youtuber",
  },
  {
    id: "girlFashionDesigner",
    name: "Fashion Designer (Female)",
    type: "shirt",
    src: girlFashionDesigner,
    gender: "female",
    occupation: "fashion",
  },
  {
    id: "girlTeacher",
    name: "Teacher (Female)",
    type: "shirt",
    src: girlTeacher,
    gender: "female",
    occupation: "teacher",
  },
  {
    id: "girlPilot",
    name: "Pilot (Female)",
    type: "shirt",
    src: girlPilot,
    gender: "female",
    occupation: "pilot",
  },
];
