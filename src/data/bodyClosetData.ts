import type { ClosetItemDefinition } from "../types";

// Boys Only Imports
import boyHair1 from "../assets/boys only/body/boy hair 1.png";
import boyHair2 from "../assets/boys only/body/boy hair 2.png";
import boyEyes1 from "../assets/boys only/body/boy eyes.png";

// Girls Only Imports
import girlHair1 from "../assets/girls only/body/girl hair 1.png";
import girlHair2 from "../assets/girls only/body/girl hair 2.png";
import girlEyes1 from "../assets/girls only/body/girl eyes.png";

export const bodyClosetData: ClosetItemDefinition[] = [
  {
    id: "boyEyes1",
    name: "Boy Eyes Style 1",
    type: "eyes",
    src: boyEyes1,
    gender: "male",
    snapItems: false,
  },
  {
    id: "girlEyes1",
    name: "Girl Eyes Style 1",
    type: "eyes",
    src: girlEyes1,
    gender: "female",
    snapItems: true,
  },
  {
    id: "boyHair1",
    name: "Boy Hair Style 1",
    type: "hair",
    src: boyHair1,
    gender: "male",
    snapItems: true,
  },
  {
    id: "boyHair2",
    name: "Boy Hair Style 2",
    type: "hair",
    src: boyHair2,
    gender: "male",
    snapItems: true,
  },
  {
    id: "girlHair1",
    name: "Girl Hair Style 1",
    type: "hair",
    src: girlHair1,
    gender: "female",
    snapItems: true,
  },
  {
    id: "girlHair2",
    name: "Girl Hair Style 2",
    type: "hair",
    src: girlHair2,
    gender: "female",
    snapItems: true,
  },
];
