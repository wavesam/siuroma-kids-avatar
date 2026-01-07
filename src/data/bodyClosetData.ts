import type { ClosetItem } from "../types";

// Boys Only Imports
import boyHair1 from "../assets/boys only/body/boy hair 1.png";
import boyHair2 from "../assets/boys only/body/boy hair 2.png";
import boyEyes1 from "../assets/boys only/body/boy eyes.png";

// Girls Only Imports
import girlHair1 from "../assets/girls only/body/girl hair 1.png";
import girlHair2 from "../assets/girls only/body/girl hair 2.png";
import girlEyes1 from "../assets/girls only/body/girl eyes.png";
export const bodyClosetData: ClosetItem[] = [
  {
    id: "boyEyes1",
    name: "Boy Eyes Style 1",
    type: "glasses",
    size: 100,
    offsetY: 0,
    src: boyEyes1,
    gender: "male",
    tab: "body",
  },
  {
    id: "girlEyes1",
    name: "Girl Eyes Style 1",
    type: "glasses",
    size: 100,
    offsetY: 0,
    src: girlEyes1,
    gender: "female",
    tab: "body",
  },
  {
    id: "boyHair1",
    name: "Boy Hair Style 1",
    type: "hair",
    size: 100,
    offsetY: 0,
    src: boyHair1,
    gender: "male",
    tab: "body",
    occupation: "hair",
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
    occupation: "hair",
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
    occupation: "hair",
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
