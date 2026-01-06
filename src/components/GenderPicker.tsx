import type { Gender } from "../types";

export function GenderPicker({ onPick }: { onPick: (g: Gender) => void }) {
  return (
    <div className="card">
      <h1>Choose an avatar</h1>
      <div className="row">
        <button onClick={() => onPick("male")}>Male</button>
        <button onClick={() => onPick("female")}>Female</button>
      </div>
    </div>
  );
}
