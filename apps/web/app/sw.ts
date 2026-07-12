/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const NETWORK_ONLY_ROOTS = [
  "/api",
  "/serwist",
  "/admin",
  "/client",
  "/technician",
  "/login",
  "/register",
  "/settings",
];

function isNetworkOnlyPath(pathname: string): boolean {
  return NETWORK_ONLY_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Never cache Supabase Auth/REST/Storage — stale SW caused Failed to fetch after project switch
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") ||
        url.hostname.endsWith(".supabase.in"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) => isNetworkOnlyPath(url.pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return (
            request.destination === "document" &&
            !isNetworkOnlyPath(new URL(request.url).pathname)
          );
        },
      },
    ],
  },
});

serwist.addEventListeners();
