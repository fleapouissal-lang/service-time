import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { buildContentSecurityPolicy } from "./lib/content-security-policy";

const webDir = __dirname;
const rootDir = path.join(__dirname, "../..");

loadEnvConfig(rootDir);
loadEnvConfig(webDir);

function allowedDevOriginsFromEnv(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return [];

  try {
    const { hostname } = new URL(appUrl);
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
      return [];
    }
    return [hostname];
  } catch {
    return [];
  }
}

function supabaseImageRemotePattern():
  | { protocol: "https"; hostname: string }
  | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;

  try {
    return { protocol: "https", hostname: new URL(raw).hostname };
  } catch {
    return null;
  }
}

const supabaseImagePattern = supabaseImageRemotePattern();

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOriginsFromEnv(),
  transpilePackages: ["@service-time/types", "@imgly/background-removal"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logos/icon.png",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/track",
        destination: "/login?next=/client/track",
        permanent: false,
      },
      {
        source: "/track/:token",
        destination: "/login?next=/client/track/:token",
        permanent: false,
      },
    ];
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = buildContentSecurityPolicy(isDev);

    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/hero-bg:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/cta-bg.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
