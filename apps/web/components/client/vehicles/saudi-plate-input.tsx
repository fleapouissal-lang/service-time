"use client";

import { cn } from "@/lib/utils";

type SaudiPlateInputProps = {
  letters: string;
  numbers: string;
  onLettersChange: (value: string) => void;
  onNumbersChange: (value: string) => void;
  lettersLabel: string;
  numbersLabel: string;
};

export function SaudiPlateInput({
  letters,
  numbers,
  onLettersChange,
  onNumbersChange,
  lettersLabel,
  numbersLabel,
}: SaudiPlateInputProps) {
  return (
    <div className="add-vehicle-plate">
      <div className="add-vehicle-plate__segment add-vehicle-plate__segment--letters">
        <label className="sr-only" htmlFor="plate_letters">
          {lettersLabel}
        </label>
        <input
          id="plate_letters"
          name="plate_letters"
          value={letters}
          onChange={(event) =>
            onLettersChange(
              event.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, "").slice(0, 5),
            )
          }
          placeholder="S V D"
          dir="ltr"
          className="add-vehicle-plate__input add-vehicle-plate__input--letters"
          autoComplete="off"
        />
      </div>
      <div className="add-vehicle-plate__emblem" aria-hidden>
        <span className="add-vehicle-plate__emblem-mark">☘</span>
      </div>
      <div className="add-vehicle-plate__segment add-vehicle-plate__segment--numbers">
        <label className="sr-only" htmlFor="plate_number">
          {numbersLabel}
        </label>
        <input
          id="plate_number"
          name="plate_number"
          value={numbers}
          onChange={(event) =>
            onNumbersChange(event.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="8406"
          dir="ltr"
          inputMode="numeric"
          className="add-vehicle-plate__input add-vehicle-plate__input--numbers"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
