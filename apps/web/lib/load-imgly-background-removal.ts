import type * as ImglyBackgroundRemoval from "@imgly/background-removal";

declare global {
  interface Window {
    __serviceTimeImgly?: typeof ImglyBackgroundRemoval;
  }
}

let loadPromise: Promise<typeof ImglyBackgroundRemoval> | null = null;

function moduleUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return new URL("/imgly-bg-removal.mjs", window.location.origin).href;
}

/**
 * Load a self-hosted IMG.LY bundle (see npm run bundle:imgly-bg) outside Turbopack.
 */
export function loadImglyBackgroundRemovalModule(): Promise<
  typeof ImglyBackgroundRemoval
> {
  if (typeof window === "undefined") {
    return import("@imgly/background-removal");
  }

  if (window.__serviceTimeImgly) {
    return Promise.resolve(window.__serviceTimeImgly);
  }

  if (loadPromise) {
    return loadPromise;
  }

  const url = moduleUrl();

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import * as imgly from ${JSON.stringify(url)};
      window.__serviceTimeImgly = imgly;
      window.dispatchEvent(new CustomEvent("servicetime-imgly-ready"));
    `;

    const onReady = () => {
      window.removeEventListener("servicetime-imgly-ready", onReady);
      if (window.__serviceTimeImgly) {
        resolve(window.__serviceTimeImgly);
        return;
      }
      loadPromise = null;
      reject(new Error("IMG.LY module did not initialize"));
    };

    script.onerror = () => {
      loadPromise = null;
      reject(
        new Error(
          "Failed to load IMG.LY bundle. Run: npm run bundle:imgly-bg",
        ),
      );
    };

    window.addEventListener("servicetime-imgly-ready", onReady);
    document.head.appendChild(script);
  });

  return loadPromise;
}
