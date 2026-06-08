"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductImageStudioModal } from "@/components/admin/product-image-studio-modal";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ProductImageStudioSettings } from "@/lib/product-image-studio";
import { cn } from "@/lib/utils";

export type MultiPhotoUploadFieldProps = {
  id: string;
  defaultImages?: string[];
  accept?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  hint?: string;
  addMoreLabel?: string;
  removeLabel?: string;
  imageStudio?: boolean;
};

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
  originalFile: File;
  studioSettings?: ProductImageStudioSettings;
  backgroundImageFile?: File | null;
};

export function MultiPhotoUploadField({
  id,
  defaultImages = [],
  accept = "image/jpeg,image/png,image/webp",
  title,
  subtitle,
  buttonLabel,
  hint,
  addMoreLabel,
  removeLabel,
  imageStudio = false,
}: MultiPhotoUploadFieldProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartsPage;
  const resolvedTitle = title ?? p.partImages;
  const resolvedSubtitle = subtitle ?? t.request.form.photoSubtitle;
  const resolvedButtonLabel = buttonLabel ?? t.request.form.photoButton;
  const resolvedHint = hint ?? `${t.request.form.photoHint} — ${p.imageHint}`;
  const resolvedAddMore = addMoreLabel ?? p.addMorePhotos;
  const resolvedRemove = removeLabel ?? p.removePhoto;

  const [keptUrls, setKeptUrls] = useState<string[]>(defaultImages);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [studioQueue, setStudioQueue] = useState<File[]>([]);
  const [studioFile, setStudioFile] = useState<File | null>(null);
  const [studioBatchTotal, setStudioBatchTotal] = useState(0);
  const [studioInitialSettings, setStudioInitialSettings] = useState<
    ProductImageStudioSettings | undefined
  >(undefined);
  const [studioInitialBackgroundImageFile, setStudioInitialBackgroundImageFile] =
    useState<File | null>(null);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const studioOpen = studioFile !== null;

  const existingImagesJson = useMemo(
    () => JSON.stringify(keptUrls),
    [keptUrls],
  );

  useEffect(() => {
    setKeptUrls(defaultImages);
  }, [defaultImages]);

  useEffect(() => {
    return () => {
      for (const pending of pendingFiles) {
        if (isBlobUrl(pending.previewUrl)) {
          URL.revokeObjectURL(pending.previewUrl);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup blob URLs on unmount
  }, []);

  const totalCount = keptUrls.length + pendingFiles.length;

  function removeKeptUrl(url: string) {
    setKeptUrls((current) => current.filter((item) => item !== url));
  }

  function removePending(id: string) {
    setPendingFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target && isBlobUrl(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function addPendingFile(
    file: File,
    originalFile: File,
    studioSettings?: ProductImageStudioSettings,
    replaceId?: string,
    backgroundImageFile?: File | null,
  ) {
    const previewUrl = URL.createObjectURL(file);
    const id =
      replaceId ??
      `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;

    setPendingFiles((current) => {
      if (replaceId) {
        const previous = current.find((item) => item.id === replaceId);
        if (previous && isBlobUrl(previous.previewUrl)) {
          URL.revokeObjectURL(previous.previewUrl);
        }
        return current.map((item) =>
          item.id === replaceId
            ? {
                ...item,
                file,
                previewUrl,
                originalFile,
                studioSettings,
                backgroundImageFile: backgroundImageFile ?? item.backgroundImageFile,
              }
            : item,
        );
      }
      return [
        ...current,
        {
          id,
          file,
          previewUrl,
          originalFile,
          studioSettings,
          backgroundImageFile: backgroundImageFile ?? null,
        },
      ];
    });
  }

  function openNextStudioFile(queue: File[]) {
    if (!queue.length) {
      setStudioFile(null);
      setStudioQueue([]);
      setStudioInitialSettings(undefined);
      setStudioInitialBackgroundImageFile(null);
      setEditingPendingId(null);
      return;
    }

    const [next, ...rest] = queue;
    setStudioFile(next);
    setStudioQueue(rest);
    setStudioInitialSettings(undefined);
    setStudioInitialBackgroundImageFile(null);
  }

  function closeStudio() {
    setStudioFile(null);
    setStudioQueue([]);
    setStudioInitialSettings(undefined);
    setStudioInitialBackgroundImageFile(null);
    setEditingPendingId(null);
  }

  function handleStudioApply(
    processed: File,
    settings: ProductImageStudioSettings,
    meta: { backgroundImageFile: File | null },
  ) {
    if (!studioFile) return;

    if (editingPendingId) {
      addPendingFile(
        processed,
        studioFile,
        settings,
        editingPendingId,
        meta.backgroundImageFile,
      );
      closeStudio();
      return;
    }

    addPendingFile(
      processed,
      studioFile,
      settings,
      undefined,
      meta.backgroundImageFile,
    );
    openNextStudioFile(studioQueue);
  }

  function handleStudioSkipOriginal() {
    if (!studioFile) return;

    if (editingPendingId) {
      closeStudio();
      return;
    }

    addPendingFile(studioFile, studioFile);
    openNextStudioFile(studioQueue);
  }

  function startStudioForFiles(files: File[]) {
    if (!files.length) return;
    const [first, ...rest] = files;
    setStudioBatchTotal(files.length);
    setStudioQueue(rest);
    setStudioFile(first);
    setStudioInitialSettings(undefined);
    setStudioInitialBackgroundImageFile(null);
    setEditingPendingId(null);
  }

  function editPendingInStudio(pending: PendingFile) {
    setStudioFile(pending.originalFile);
    setStudioQueue([]);
    setStudioInitialSettings(pending.studioSettings);
    setStudioInitialBackgroundImageFile(pending.backgroundImageFile ?? null);
    setEditingPendingId(pending.id);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="existing_images" value={existingImagesJson} />

      {totalCount > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {keptUrls.map((url) => (
            <li
              key={url}
              className="relative overflow-hidden rounded-[14px] border border-[#94D4B9]/25 bg-[#050B10]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeKeptUrl(url)}
                className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full border border-red-400/40 bg-[#050B10]/90 text-red-300 transition-colors hover:bg-red-950/80"
                aria-label={resolvedRemove}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}

          {pendingFiles.map((pending) => (
            <li
              key={pending.id}
              className="relative overflow-hidden rounded-[14px] border border-[#94D4B9]/25 bg-[#050B10]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.previewUrl}
                alt={pending.file.name}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                {imageStudio ? (
                  <button
                    type="button"
                    onClick={() => editPendingInStudio(pending)}
                    className="flex size-7 items-center justify-center rounded-full border border-[#94D4B9]/45 bg-[#050B10]/90 text-[#94D4B9] transition-colors hover:bg-[#94D4B9]/15"
                    aria-label={p.editPhotoStudio}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removePending(pending.id)}
                  className="flex size-7 items-center justify-center rounded-full border border-red-400/40 bg-[#050B10]/90 text-red-300 transition-colors hover:bg-red-950/80"
                  aria-label={resolvedRemove}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <label
        htmlFor={id}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed border-[#94D4B9]/45 bg-[#050B10] px-6 py-8 transition-all duration-300",
          "hover:border-[#94D4B9]/70 hover:bg-[#091014] hover:shadow-[0_8px_32px_rgba(148,212,185,0.12)]",
          totalCount > 0 && "py-6",
        )}
      >
        <div className="relative flex size-16 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border border-[#94D4B9]/20"
            aria-hidden
          />
          <span className="flex size-12 items-center justify-center rounded-full border border-[#94D4B9]/45 bg-[#091014]">
            <Plus className="size-6 text-[#94D4B9]" strokeWidth={1.5} aria-hidden />
          </span>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-base font-semibold text-[#94D4B9]">
            {totalCount > 0 ? resolvedAddMore : resolvedTitle}
          </p>
          <p className="text-sm text-[#94D4B9]/75">{resolvedSubtitle}</p>
        </div>

        <span className="rounded-full border border-[#94D4B9] px-6 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#94D4B9] transition-colors group-hover:bg-[#94D4B9]/10">
          {totalCount > 0 ? resolvedAddMore : resolvedButtonLabel}
        </span>

        <input
          key={inputKey}
          id={id}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (!files.length) return;

            if (imageStudio) {
              startStudioForFiles(files);
            } else {
              for (const file of files) {
                addPendingFile(file, file);
              }
            }
            setInputKey((value) => value + 1);
          }}
        />
      </label>

      {imageStudio ? (
        <ProductImageStudioModal
          open={studioOpen}
          file={studioFile}
          initialSettings={studioInitialSettings}
          initialBackgroundImageFile={studioInitialBackgroundImageFile}
          queuePosition={
            !editingPendingId && studioBatchTotal > 1
              ? {
                  current: studioBatchTotal - studioQueue.length,
                  total: studioBatchTotal,
                }
              : undefined
          }
          onClose={closeStudio}
          onApply={handleStudioApply}
          onSkip={editingPendingId ? undefined : handleStudioSkipOriginal}
        />
      ) : null}

      {pendingFiles.map((pending) => (
        <input
          key={`file-${pending.id}`}
          type="file"
          name="new_images"
          className="hidden"
          tabIndex={-1}
          aria-hidden
          ref={(node) => {
            if (!node) return;
            const dt = new DataTransfer();
            dt.items.add(pending.file);
            node.files = dt.files;
          }}
        />
      ))}

      {resolvedHint ? (
        <p className="text-center text-xs text-muted">{resolvedHint}</p>
      ) : null}
    </div>
  );
}
