import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const webDir = __dirname;
const rootDir = path.join(__dirname, "../..");

loadEnvConfig(rootDir);
loadEnvConfig(webDir);

const nextConfig: NextConfig = {
  transpilePackages: [
    "@service-time/ui",
    "@service-time/lib",
    "@service-time/types",
    "@imgly/background-removal",
  ],
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
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
    return [
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
        ],
      },
    ];
  },
};

export default nextConfig;
