"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
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
};

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
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
              <button
                type="button"
                onClick={() => removePending(pending.id)}
                className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full border border-red-400/40 bg-[#050B10]/90 text-red-300 transition-colors hover:bg-red-950/80"
                aria-label={resolvedRemove}
              >
                <X className="size-3.5" aria-hidden />
              </button>
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

            setPendingFiles((current) => [
              ...current,
              ...files.map((file) => ({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                file,
                previewUrl: URL.createObjectURL(file),
              })),
            ]);
            setInputKey((value) => value + 1);
          }}
        />
      </label>

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
