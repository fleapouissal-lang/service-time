import type { Config } from "@imgly/background-removal";
import { loadImglyBackgroundRemovalModule } from "@/lib/load-imgly-background-removal";

const IMGLY_BACKGROUND_REMOVAL_VERSION = "1.7.0";

export const IMGLY_BACKGROUND_REMOVAL_PUBLIC_PATH =
  "/imgly-background-removal/";

const CDN_ASSET_PATH = `https://staticimgly.com/@imgly/background-removal-data/${IMGLY_BACKGROUND_REMOVAL_VERSION}/dist/`;

const BACKGROUND_REMOVAL_BASE_CONFIG: Omit<Config, "publicPath"> = {
  model: "isnet_quint8",
  output: {
    format: "image/png",
    quality: 0.92,
  },
  debug: process.env.NODE_ENV === "development",
  proxyToWorker: false,
  device: "cpu",
};

let preloadPromise: Promise<void> | null = null;
let resolvedPublicPath: string | null = null;

function absolutePublicPath(relativePath: string): string {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath.endsWith("/") ? relativePath : `${relativePath}/`;
  }

  if (typeof window === "undefined") {
    return CDN_ASSET_PATH;
  }

  return new URL(relativePath, window.location.origin).href;
}

async function localAssetsAvailable(publicPath: string): Promise<boolean> {
  try {
    const response = await fetch(new URL("resources.json", publicPath));
    return response.ok;
  } catch {
    return false;
  }
}

async function resolvePublicPath(): Promise<string> {
  if (resolvedPublicPath) {
    return resolvedPublicPath;
  }

  if (typeof window === "undefined") {
    resolvedPublicPath = CDN_ASSET_PATH;
    return resolvedPublicPath;
  }

  const localPublicPath = absolutePublicPath(
    IMGLY_BACKGROUND_REMOVAL_PUBLIC_PATH,
  );

  resolvedPublicPath = (await localAssetsAvailable(localPublicPath))
    ? localPublicPath
    : CDN_ASSET_PATH;

  if (
    process.env.NODE_ENV === "development" &&
    resolvedPublicPath === CDN_ASSET_PATH
  ) {
    console.warn(
      "[background-removal] Local assets missing. Run: npm run setup:imgly-assets:force",
    );
  }

  return resolvedPublicPath;
}

async function buildConfig(): Promise<Config> {
  return {
    ...BACKGROUND_REMOVAL_BASE_CONFIG,
    publicPath: await resolvePublicPath(),
  };
}

async function ensureBackgroundRemovalPreloaded(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      const mod = await loadImglyBackgroundRemovalModule();
      if (!mod.preload) return;
      await mod.preload(await buildConfig());
    })().catch((error) => {
      preloadPromise = null;
      console.error("[background-removal] preload failed", error);
      throw error;
    });
  }

  await preloadPromise;
}

export async function removeImageBackground(file: File | Blob): Promise<Blob> {
  const mod = await loadImglyBackgroundRemovalModule();
  const config = await buildConfig();

  if (mod.preload) {
    try {
      await mod.preload(config);
    } catch (error) {
      console.error("[background-removal] preload failed", error);
      throw error;
    }
  }

  return mod.removeBackground(file, config);
}
