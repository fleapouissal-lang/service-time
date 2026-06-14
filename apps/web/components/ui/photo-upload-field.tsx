"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export type PhotoUploadFieldProps = {
  id: string;
  name: string;
  accept?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  changeLabel?: string;
  hint?: string;
  defaultPreviewUrl?: string | null;
  defaultFileName?: string;
  /** Zone d'upload plus compacte (comme طلب سريع). */
  compact?: boolean;
};

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

export function PhotoUploadField({
  id,
  name,
  accept = "image/jpeg,image/png,image/webp",
  title,
  subtitle,
  buttonLabel,
  changeLabel,
  hint,
  defaultPreviewUrl = null,
  defaultFileName = "",
  compact = false,
}: PhotoUploadFieldProps) {
  const { messages: t } = useLocale();
  const resolvedTitle = title ?? t.request.form.photoTitle;
  const resolvedSubtitle = subtitle ?? t.request.form.photoSubtitle;
  const resolvedButtonLabel = buttonLabel ?? t.request.form.photoButton;
  const resolvedChangeLabel = changeLabel ?? t.request.form.photoChange;
  const resolvedHint = hint ?? t.request.form.photoHint;
  const [fileName, setFileName] = useState(defaultFileName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultPreviewUrl);

  useEffect(() => {
    return () => {
      if (previewUrl && isBlobUrl(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#94D4B9]/45 bg-[#050B10] transition-all duration-300",
          compact
            ? "gap-3 px-4 py-6 hover:border-[#94D4B9]/70 hover:bg-[#091014]"
            : "gap-5 px-6 py-10 hover:border-[#94D4B9]/70 hover:bg-[#091014] hover:shadow-[0_8px_32px_rgba(148,212,185,0.12)]",
          previewUrl &&
            (compact
              ? "border-solid border-[#94D4B9]/35 py-5"
              : "border-solid border-[#94D4B9]/35 py-8"),
        )}
      >
        {previewUrl ? (
          <>
            <div className="relative w-full max-w-xs overflow-hidden rounded-[16px] border border-[#94D4B9]/20 bg-[#091014]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName || resolvedTitle}
                className={cn(
                  "mx-auto w-full object-contain",
                  compact ? "max-h-32" : "max-h-44",
                )}
              />
            </div>
            <p className="max-w-xs truncate text-center text-sm font-medium text-[#94D4B9]">
              {fileName}
            </p>
            <span
              className={cn(
                "rounded-full border border-[#94D4B9] text-xs font-semibold tracking-wide text-[#94D4B9] transition-colors group-hover:bg-[#94D4B9]/10",
                compact ? "px-6 py-2" : "px-8 py-2.5",
              )}
            >
              {resolvedChangeLabel}
            </span>
          </>
        ) : (
          <>
            <div
              className={cn(
                "relative flex items-center justify-center",
                compact ? "size-14" : "size-20",
              )}
            >
              <span
                className="absolute inset-0 rounded-full border border-[#94D4B9]/20"
                aria-hidden
              />
              <span
                className={cn(
                  "flex items-center justify-center rounded-full border border-[#94D4B9]/45 bg-[#091014] shadow-[inset_0_0_24px_rgba(148,212,185,0.06)]",
                  compact ? "size-10" : "size-14",
                )}
              >
                <Plus
                  className={cn(iconAccentClass, compact ? "size-5" : "size-7")}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </div>

            <div className="space-y-1 text-center">
              <p
                className={cn(
                  "font-semibold text-[#94D4B9]",
                  compact ? "text-base" : "text-lg",
                )}
              >
                {resolvedTitle}
              </p>
              {!compact ? (
                <p className="text-sm text-[#94D4B9]/75">{resolvedSubtitle}</p>
              ) : null}
            </div>

            <span
              className={cn(
                "rounded-full border border-[#94D4B9] text-xs font-semibold text-[#94D4B9] transition-colors group-hover:bg-[#94D4B9]/10",
                compact
                  ? "px-6 py-2 tracking-wide"
                  : "px-8 py-2.5 uppercase tracking-[0.12em]",
              )}
            >
              {resolvedButtonLabel}
            </span>
          </>
        )}

        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setFileName(defaultFileName);
              setPreviewUrl((current) => {
                if (current && isBlobUrl(current)) {
                  URL.revokeObjectURL(current);
                }
                return defaultPreviewUrl;
              });
              return;
            }

            setFileName(file.name);
            setPreviewUrl((current) => {
              if (current && isBlobUrl(current)) {
                URL.revokeObjectURL(current);
              }
              return URL.createObjectURL(file);
            });
          }}
        />
      </label>

      {resolvedHint ? (
        <p className="text-center text-xs text-muted">{resolvedHint}</p>
      ) : null}
    </div>
  );
}
