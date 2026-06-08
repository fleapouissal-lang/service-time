"use client";

import { useRef } from "react";

/** Honeypot + timing token — include in every public server-action form. */
export function FormSecurityFields() {
  const startedAt = useRef(Date.now());

  return (
    <>
      <div
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
        aria-hidden
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input
        type="hidden"
        name="form_started_at"
        value={String(startedAt.current)}
      />
    </>
  );
}
