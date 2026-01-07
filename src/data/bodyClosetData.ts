import type { ClosetItem } from "../types";

// Boys Only Imports
import boyHair1 from "../assets/boys only/boy hair 1.png";
import boyHair2 from "../assets/boys only/boy hair 2.png";

// Girls Only Imports
import girlHair1 from "../assets/girls only/girl hair 1.png";
import girlHair2 from "../assets/girls only/girl hair 2.png";

export const bodyClosetData: ClosetItem[] = [
  {
    id: "boyHair1",
    name: "Boy Hair Style 1",
    type: "hair",
    size: 100,
    offsetY: 0,
    src: boyHair1,
    gender: "male",
    tab: "body",
    occupation: "hello",
  },
  {
    id: "boyHair2",
    name: "Boy Hair Style 2",
    type: "hair",
    size: 220,
    offsetY: 0,
    src: boyHair2,
    gender: "male",
    tab: "body",
  },
  {
    id: "girlHair1",
    name: "Girl Hair Style 1",
    type: "hair",
    size: 220,
    offsetY: 0,
    src: girlHair1,
    gender: "female",
    tab: "body",
  },
  {
    id: "girlHair2",
    name: "Girl Hair Style 2",
    type: "hair",
    size: 220,
    offsetY: 0,
    src: girlHair2,
    gender: "female",
    tab: "body",
  },
];
