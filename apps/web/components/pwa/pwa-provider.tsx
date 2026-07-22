"use client";

import { SerwistProvider } from "@serwist/turbopack/react";

/**
 * Always wrap with SerwistProvider from the first render.
 * Switching between bare `children` and a provider remounts the whole app
 * and can break React context (e.g. LocaleProvider).
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
