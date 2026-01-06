import React from "react";
import "./App.css";
import type { Gender } from "./types";
import { GenderPicker } from "./components/GenderPicker";
import { AvatarStudio } from "./components/AvatarStudio";

export default function App() {
  const [gender, setGender] = React.useState<Gender | null>(null);

  return (
    <div className="app">
      {!gender ? (
        <GenderPicker onPick={setGender} />
      ) : (
        <AvatarStudio gender={gender} onBack={() => setGender(null)} />
      )}
    </div>
  );
}
