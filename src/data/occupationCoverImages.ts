import type { Gender } from "../types";

// Import all occupation cover images
import artistM from "../assets/shared/accessories/artist/arties_m.png";
import artistW from "../assets/shared/accessories/artist/artist_w.png";
import astronautM from "../assets/shared/accessories/astronaut/astronaut_m.png";
import astronautW from "../assets/shared/accessories/astronaut/astronaut_w.png";
import chefM from "../assets/shared/accessories/chef/chef_m.png";
import chefW from "../assets/shared/accessories/chef/chef_w.png";
import dentistM from "../assets/shared/accessories/dentist/dentist_m.png";
import dentistW from "../assets/shared/accessories/dentist/dentist_w.png";
import doctorM from "../assets/shared/accessories/doctor/doctor_m.png";
import doctorW from "../assets/shared/accessories/doctor/doctor_w.png";
import fashionM from "../assets/shared/accessories/fashion_designer/designer_m.png";
import fashionW from "../assets/shared/accessories/fashion_designer/designer_w.png";
import firemanM from "../assets/shared/accessories/fireman/fireman.png";
import firemanW from "../assets/shared/accessories/fireman/firewoman.png";
import musicianM from "../assets/shared/accessories/musician/musician_m.png";
import musicianW from "../assets/shared/accessories/musician/musician_w.png";
import nurseM from "../assets/shared/accessories/nurse/nurse_m.png";
import nurseW from "../assets/shared/accessories/nurse/nurse_w.png";
import pilotM from "../assets/shared/accessories/pilot/pilot_m.png";
import pilotW from "../assets/shared/accessories/pilot/pilot_w.png";
import policeM from "../assets/shared/accessories/police/police_m.png";
import policeW from "../assets/shared/accessories/police/police_w.png";
import teacherM from "../assets/shared/accessories/teacher/teacher_m.png";
import teacherW from "../assets/shared/accessories/teacher/teacher_w.png";
import veterinarianM from "../assets/shared/accessories/veterinarian/veterinarian_m.png";
import veterinarianW from "../assets/shared/accessories/veterinarian/veterinarian_w.png";
import youtuberM from "../assets/shared/accessories/social_media/youtuber_m.png";
import youtuberW from "../assets/shared/accessories/social_media/youtuber_w.png";

/**
 * Occupation cover image mappings
 * Maps occupation name to gender-specific cover images
 */
export const OCCUPATION_COVER_IMAGES: Record<
  string,
  { male: string; female: string }
> = {
  artist: { male: artistM, female: artistW },
  astronaut: { male: astronautM, female: astronautW },
  chef: { male: chefM, female: chefW },
  dentist: { male: dentistM, female: dentistW },
  doctor: { male: doctorM, female: doctorW },
  fashion: { male: fashionM, female: fashionW },
  fireman: { male: firemanM, female: firemanW },
  musician: { male: musicianM, female: musicianW },
  nurse: { male: nurseM, female: nurseW },
  pilot: { male: pilotM, female: pilotW },
  police: { male: policeM, female: policeW },
  teacher: { male: teacherM, female: teacherW },
  veterinarian: { male: veterinarianM, female: veterinarianW },
  youtuber: { male: youtuberM, female: youtuberW },
  // singer uses outfit data, not accessories, so no cover image needed
};

/**
 * Get the cover image for an occupation based on gender
 */
export function getOccupationCoverImage(
  occupation: string,
  gender: Gender
): string | undefined {
  const covers = OCCUPATION_COVER_IMAGES[occupation];
  if (!covers) return undefined;
  return gender === "male" ? covers.male : covers.female;
}
