"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS,
  mergeStudioSettings,
  PRODUCT_IMAGE_STUDIO_PRESETS,
  removeImageBackground,
  renderProductImage,
  studioBlobToFile,
  type ProductImageBackground,
  type ProductImageStudioSettings,
} from "@/lib/product-image-studio";
import { cn } from "@/lib/utils";

export type ProductImageStudioApplyMeta = {
  backgroundImageFile: File | null;
};

type ProductImageStudioModalProps = {
  open: boolean;
  file: File | null;
  initialSettings?: ProductImageStudioSettings;
  initialBackgroundImageFile?: File | null;
  queuePosition?: { current: number; total: number };
  onClose: () => void;
  onApply: (
    file: File,
    settings: ProductImageStudioSettings,
    meta: ProductImageStudioApplyMeta,
  ) => void;
  onSkip?: () => void;
};

function StudioSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <Label htmlFor={id} className="text-muted">
          {label}
        </Label>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#94D4B9]"
      />
    </div>
  );
}

const BACKGROUND_OPTIONS: ProductImageBackground[] = [
  "white",
  "light-gray",
  "dark",
  "studio",
  "brand",
  "custom",
  "image",
];

export function ProductImageStudioModal({
  open,
  file,
  initialSettings,
  initialBackgroundImageFile = null,
  queuePosition,
  onClose,
  onApply,
  onSkip,
}: ProductImageStudioModalProps) {
  const { messages: t } = useLocale();
  const s = t.dashboard.admin.sparePartsPage.imageStudio;
  const [settings, setSettings] = useState<ProductImageStudioSettings>(
    initialSettings ?? DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS,
  );
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(
    initialBackgroundImageFile,
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    initialSettings?.backgroundImageUrl ?? null,
  );
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemovalError, setBgRemovalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [applying, setApplying] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSettings(initialSettings ?? DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS);
    setBackgroundImageFile(initialBackgroundImageFile);
    setBackgroundImageUrl(initialSettings?.backgroundImageUrl ?? null);
    setCutoutBlob(null);
    setBgRemovalError(null);
  }, [open, file, initialSettings, initialBackgroundImageFile]);

  useEffect(() => {
    if (backgroundImageFile) {
      const url = URL.createObjectURL(backgroundImageFile);
      setBackgroundImageUrl((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return url;
      });
      return () => URL.revokeObjectURL(url);
    }
  }, [backgroundImageFile]);

  useEffect(() => {
    setSettings((current) => ({
      ...current,
      backgroundImageUrl,
    }));
  }, [backgroundImageUrl]);

  const updateSettings = useCallback(
    (patch: Partial<ProductImageStudioSettings>) => {
      setSettings((current) => mergeStudioSettings(current, patch));
    },
    [],
  );

  useEffect(() => {
    if (!open || !file || !settings.removeBackground) {
      setCutoutBlob(null);
      setBgRemovalError(null);
      return;
    }

    let cancelled = false;
    setRemovingBg(true);
    setBgRemovalError(null);

    void removeImageBackground(file)
      .then((blob) => {
        if (!cancelled) setCutoutBlob(blob);
      })
      .catch(() => {
        if (!cancelled) {
          setCutoutBlob(null);
          setBgRemovalError(s.bgRemovalFailed);
        }
      })
      .finally(() => {
        if (!cancelled) setRemovingBg(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, file, settings.removeBackground, s.bgRemovalFailed]);

  useEffect(() => {
    if (!open || !file) {
      setPreviewUrl((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    if (settings.removeBackground && removingBg) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setRendering(true);
      try {
        const blob = await renderProductImage(file, settings, {
          cutoutBlob: settings.removeBackground ? cutoutBlob : null,
        });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl((current) => {
          if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
          return url;
        });
      } catch {
        if (!cancelled) {
          setPreviewUrl((current) => {
            if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
            return null;
          });
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, file, settings, cutoutBlob, removingBg]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const presetLabels = useMemo(
    () =>
      ({
        "studio-white": s.presetStudioWhite,
        catalog: s.presetCatalog,
        "premium-dark": s.presetPremiumDark,
        "brand-glow": s.presetBrandGlow,
      }) as Record<string, string>,
    [s],
  );

  const backgroundLabels = useMemo(
    () =>
      ({
        white: s.bgWhite,
        "light-gray": s.bgLightGray,
        dark: s.bgDark,
        studio: s.bgStudio,
        brand: s.bgBrand,
        custom: s.bgCustom,
        image: s.bgImage,
      }) as Record<ProductImageBackground, string>,
    [s],
  );

  if (!open || !file) return null;

  async function handleApply() {
    if (!file) return;
    setApplying(true);
    try {
      const blob = await renderProductImage(file, settings, {
        cutoutBlob: settings.removeBackground ? cutoutBlob : null,
      });
      const processed = studioBlobToFile(blob, file.name);
      onApply(processed, settings, { backgroundImageFile });
    } finally {
      setApplying(false);
    }
  }

  const busy = applying || rendering || removingBg;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-image-studio-title"
      onClick={() => !applying && onClose()}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2
              id="product-image-studio-title"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Sparkles className="size-5 text-[#94D4B9]" aria-hidden />
              {s.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{s.subtitle}</p>
            {queuePosition && queuePosition.total > 1 ? (
              <p className="mt-1 text-xs text-muted">
                {s.queueProgress
                  .replace("{current}", String(queuePosition.current))
                  .replace("{total}", String(queuePosition.total))}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="rounded-full border border-border p-2 text-muted transition-colors hover:bg-muted/20 hover:text-foreground"
            aria-label={t.common.cancel}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-5">
          <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl border border-[#94D4B9]/25 bg-[#050B10]">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={s.previewAlt}
                className="max-h-[min(52vh,420px)] w-full object-contain"
              />
            ) : (
              <p className="px-4 text-center text-sm text-muted">
                {removingBg ? s.removingBackground : s.previewLoading}
              </p>
            )}
            {busy ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25">
                <Loader2 className="size-8 animate-spin text-[#94D4B9]" aria-hidden />
                {removingBg ? (
                  <p className="text-xs text-[#94D4B9]/90">{s.removingBackground}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5">
              <input
                type="checkbox"
                checked={settings.removeBackground}
                onChange={(event) =>
                  updateSettings({ removeBackground: event.target.checked })
                }
                className="size-4 accent-[#94D4B9]"
              />
              <span className="text-sm font-medium">{s.removeBackground}</span>
            </label>

            {bgRemovalError ? (
              <p className="rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                {bgRemovalError}
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {s.presets}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_IMAGE_STUDIO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setSettings(
                        mergeStudioSettings(
                          DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS,
                          preset.settings,
                        ),
                      )
                    }
                    className="rounded-full border border-[#94D4B9]/35 px-3 py-1.5 text-xs font-medium text-[#94D4B9] transition-colors hover:bg-[#94D4B9]/10"
                  >
                    {presetLabels[preset.id]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSettings(DEFAULT_PRODUCT_IMAGE_STUDIO_SETTINGS);
                    setBackgroundImageFile(null);
                    setBackgroundImageUrl(null);
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-muted/20"
                >
                  {s.reset}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {s.background}
              </p>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateSettings({ background: option })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      settings.background === option
                        ? "border-[#94D4B9] bg-[#94D4B9]/15 text-[#94D4B9]"
                        : "border-border text-muted hover:bg-muted/20",
                    )}
                  >
                    {backgroundLabels[option]}
                  </button>
                ))}
              </div>

              {settings.background === "custom" ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.customBackgroundColor}
                    onChange={(event) =>
                      updateSettings({ customBackgroundColor: event.target.value })
                    }
                    className="size-10 cursor-pointer rounded border border-border bg-transparent"
                    aria-label={s.customColor}
                  />
                  <span className="text-xs text-muted">{s.customColor}</span>
                </div>
              ) : null}

              {settings.background === "image" ? (
                <div className="mt-3 space-y-2">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const next = event.target.files?.[0];
                      if (!next) return;
                      setBackgroundImageFile(next);
                      event.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" aria-hidden />
                    {backgroundImageFile ? s.changeBgImage : s.chooseBgImage}
                  </Button>
                  {backgroundImageUrl ? (
                    <div className="overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={backgroundImageUrl}
                        alt={s.bgImagePreviewAlt}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{s.bgImageHint}</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <StudioSlider
                id="studio-padding"
                label={s.padding}
                value={settings.paddingPercent}
                min={4}
                max={30}
                onChange={(value) => updateSettings({ paddingPercent: value })}
              />
              <StudioSlider
                id="studio-brightness"
                label={s.brightness}
                value={settings.brightness}
                min={70}
                max={140}
                onChange={(value) => updateSettings({ brightness: value })}
              />
              <StudioSlider
                id="studio-contrast"
                label={s.contrast}
                value={settings.contrast}
                min={70}
                max={140}
                onChange={(value) => updateSettings({ contrast: value })}
              />
              <StudioSlider
                id="studio-saturation"
                label={s.saturation}
                value={settings.saturation}
                min={0}
                max={160}
                onChange={(value) => updateSettings({ saturation: value })}
              />
              <StudioSlider
                id="studio-spotlight"
                label={s.spotlight}
                value={settings.spotlight}
                min={0}
                max={100}
                onChange={(value) => updateSettings({ spotlight: value })}
              />
              <StudioSlider
                id="studio-spotlight-x"
                label={s.spotlightX}
                value={settings.spotlightX}
                min={0}
                max={100}
                onChange={(value) => updateSettings({ spotlightX: value })}
              />
              <StudioSlider
                id="studio-spotlight-y"
                label={s.spotlightY}
                value={settings.spotlightY}
                min={0}
                max={100}
                onChange={(value) => updateSettings({ spotlightY: value })}
              />
              <StudioSlider
                id="studio-vignette"
                label={s.vignette}
                value={settings.vignette}
                min={0}
                max={100}
                onChange={(value) => updateSettings({ vignette: value })}
              />
              <StudioSlider
                id="studio-shadow"
                label={s.shadow}
                value={settings.shadow}
                min={0}
                max={100}
                onChange={(value) => updateSettings({ shadow: value })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          {onSkip ? (
            <Button type="button" variant="outline" onClick={onSkip} disabled={applying}>
              {s.skipOriginal}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={applying}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={
              busy ||
              (settings.background === "image" && !backgroundImageUrl)
            }
          >
            {applying ? s.applying : s.apply}
          </Button>
        </div>
      </div>
    </div>
  );
}
