"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * Always wrap with SerwistProvider from the first render.
 * Switching between bare `children` and a provider remounts the whole app
 * and can break React context (e.g. LocaleProvider).
 *
 * Disable SW registration in development: Turbopack HMR aborts in-flight
 * register() calls and Serwist logs AbortError noise that is harmless but noisy.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== "production"}
    >
      {children}
    </SerwistProvider>
  );
}
