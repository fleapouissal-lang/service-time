import { removeImageBackground } from "@/lib/remove-image-background";

export type ProductImageBackground =
  | "white"
  | "light-gray"
  | "dark"
  | "studio"
  | "brand"
  | "custom"
  | "image";

export type ProductImageStudioSettings = {
  removeBackground: boolean;
  background: ProductImageBackground;
  customBackgroundColor: string;
  backgroundImageUrl: string | null;
  paddingPercent: number;
  brightness: number;
  contrast: number;
  saturation: number;
  spotlight: number;
  spotlightX: number;
  spotlightY: number;
  vignette: number;
  shadow: number;
  outputSize: 800 | 1024 | 1200;
};

export const DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS: ProductImageStudioSettings =
  {
    removeBackground: true,
    background: "white",
    customBackgroundColor: "#ffffff",
    backgroundImageUrl: null,
    paddingPercent: 12,
    brightness: 105,
    contrast: 108,
    saturation: 105,
    spotlight: 35,
    spotlightX: 50,
    spotlightY: 18,
    vignette: 12,
    shadow: 45,
    outputSize: 1024,
  };

export type ProductImageStudioPreset = {
  id: string;
  settings: Partial<ProductImageStudioSettings>;
};

export const PRODUCT_IMAGE_STUDIO_PRESETS: ProductImageStudioPreset[] = [
  {
    id: "studio-white",
    settings: {
      removeBackground: true,
      background: "white",
      paddingPercent: 14,
      brightness: 108,
      contrast: 110,
      saturation: 102,
      spotlight: 40,
      spotlightX: 50,
      spotlightY: 15,
      vignette: 8,
      shadow: 50,
    },
  },
  {
    id: "catalog",
    settings: {
      removeBackground: true,
      background: "light-gray",
      paddingPercent: 10,
      brightness: 100,
      contrast: 105,
      saturation: 100,
      spotlight: 0,
      vignette: 0,
      shadow: 25,
    },
  },
  {
    id: "premium-dark",
    settings: {
      removeBackground: true,
      background: "dark",
      paddingPercent: 16,
      brightness: 112,
      contrast: 115,
      saturation: 95,
      spotlight: 65,
      spotlightX: 50,
      spotlightY: 12,
      vignette: 25,
      shadow: 70,
    },
  },
  {
    id: "brand-glow",
    settings: {
      removeBackground: true,
      background: "brand",
      paddingPercent: 14,
      brightness: 110,
      contrast: 112,
      saturation: 108,
      spotlight: 55,
      spotlightX: 72,
      spotlightY: 22,
      vignette: 18,
      shadow: 55,
    },
  },
];

const BACKGROUND_COLORS: Record<
  Exclude<ProductImageBackground, "custom" | "image">,
  { solid?: string; stops?: [string, string] }
> = {
  white: { solid: "#ffffff" },
  "light-gray": { solid: "#f3f4f6" },
  dark: { solid: "#141820" },
  studio: { stops: ["#eef2f5", "#d8e0e8"] },
  brand: { stops: ["#0a1218", "#050b10"] },
};

function loadImage(source: File | string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | null = null;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    if (typeof source === "string") {
      img.crossOrigin = "anonymous";
      img.src = source;
      return;
    }

    objectUrl = URL.createObjectURL(source);
    img.src = objectUrl;
  });
}

async function resolveProductImage(
  source: File | string,
  settings: ProductImageStudioSettings,
  cutoutBlob?: Blob | null,
): Promise<HTMLImageElement> {
  if (settings.removeBackground) {
    const cutout =
      cutoutBlob ??
      (source instanceof File || typeof source === "string"
        ? await removeImageBackground(
            source instanceof File ? source : await fileFromUrl(source),
          )
        : null);

    if (cutout) {
      return loadImage(cutout);
    }
  }

  return loadImage(source);
}

async function fileFromUrl(url: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], "product.png", { type: blob.type || "image/png" });
}

function drawColorBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  settings: ProductImageStudioSettings,
) {
  if (settings.background === "custom") {
    ctx.fillStyle = settings.customBackgroundColor;
    ctx.fillRect(0, 0, size, size);
    return;
  }

  if (settings.background === "image") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    return;
  }

  const bg = BACKGROUND_COLORS[settings.background];
  if (bg.solid) {
    ctx.fillStyle = bg.solid;
    ctx.fillRect(0, 0, size, size);
    return;
  }

  if (bg.stops) {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, bg.stops[0]);
    gradient.addColorStop(1, bg.stops[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
}

function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  size: number,
  bgImg: HTMLImageElement,
) {
  const scale = Math.max(size / bgImg.width, size / bgImg.height);
  const dw = bgImg.width * scale;
  const dh = bgImg.height * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;
  ctx.drawImage(bgImg, dx, dy, dw, dh);
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  settings: ProductImageStudioSettings,
) {
  if (settings.background === "image" && settings.backgroundImageUrl) {
    try {
      const bgImg = await loadImage(settings.backgroundImageUrl);
      drawBackgroundImage(ctx, size, bgImg);
      return;
    } catch {
      drawColorBackground(ctx, size, {
        ...settings,
        background: "white",
      });
      return;
    }
  }

  drawColorBackground(ctx, size, settings);
}

function drawProductShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity: number,
) {
  const alpha = (intensity / 100) * 0.35;
  const shadowY = y + h - h * 0.04;
  const shadowW = w * 0.72;
  const shadowH = h * 0.08;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.filter = `blur(${Math.max(8, intensity * 0.35)}px)`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, shadowY, shadowW / 2, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpotlight(
  ctx: CanvasRenderingContext2D,
  size: number,
  settings: ProductImageStudioSettings,
) {
  const cx = (settings.spotlightX / 100) * size;
  const cy = (settings.spotlightY / 100) * size;
  const radius = size * (0.45 + settings.spotlight / 200);
  const alpha = (settings.spotlight / 100) * 0.55;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(0.55, `rgba(255, 255, 255, ${alpha * 0.25})`);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  size: number,
  intensity: number,
) {
  const alpha = (intensity / 100) * 0.65;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.25,
    size / 2,
    size / 2,
    size * 0.72,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

export type RenderProductImageOptions = {
  cutoutBlob?: Blob | null;
};

export async function renderProductImage(
  source: File | string,
  settings: ProductImageStudioSettings,
  options?: RenderProductImageOptions,
): Promise<Blob> {
  const img = await resolveProductImage(
    source,
    settings,
    options?.cutoutBlob,
  );
  const size = settings.outputSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  await drawBackground(ctx, size, settings);

  const pad = (settings.paddingPercent / 100) * size;
  const maxW = size - pad * 2;
  const maxH = size - pad * 2;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;

  if (settings.shadow > 0) {
    drawProductShadow(ctx, dx, dy, dw, dh, settings.shadow);
  }

  ctx.save();
  ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  if (settings.spotlight > 0) {
    drawSpotlight(ctx, size, settings);
  }

  if (settings.vignette > 0) {
    drawVignette(ctx, size, settings.vignette);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export failed"));
      },
      "image/webp",
      0.92,
    );
  });
}

export function mergeStudioSettings(
  base: ProductImageStudioSettings,
  patch: Partial<ProductImageStudioSettings>,
): ProductImageStudioSettings {
  return { ...base, ...patch };
}

export function studioBlobToFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "part";
  return new File([blob], `${base}-studio.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function renderProductImagePreviewUrl(
  source: File | string,
  settings: ProductImageStudioSettings,
  options?: RenderProductImageOptions,
): Promise<string> {
  const blob = await renderProductImage(source, settings, options);
  return URL.createObjectURL(blob);
}

export { removeImageBackground };
