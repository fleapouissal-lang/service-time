"use client";

import { useEffect, useState } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(enable, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = globalThis.setTimeout(enable, 2500);
    return () => globalThis.clearTimeout(timer);
  }, []);

  if (!ready) {
    return children;
  }

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
