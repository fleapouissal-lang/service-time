"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
};

export function PhotoUploadField({
  id,
  name,
  accept = "image/jpeg,image/png,image/webp",
  title = "إرفاق صورة",
  subtitle = "اختياري — JPG أو PNG أو WebP",
  buttonLabel = "اختر الصورة",
  changeLabel = "تغيير الصورة",
  hint = "حد أقصى 5 MB",
}: PhotoUploadFieldProps) {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center gap-5 rounded-[20px] border-2 border-dashed border-[#94D4B9]/45 bg-[#050B10] px-6 py-10 transition-all duration-300",
          "hover:border-[#94D4B9]/70 hover:bg-[#091014] hover:shadow-[0_8px_32px_rgba(148,212,185,0.12)]",
          previewUrl && "border-solid border-[#94D4B9]/35 py-8",
        )}
      >
        {previewUrl ? (
          <>
            <div className="relative w-full max-w-xs overflow-hidden rounded-[16px] border border-[#94D4B9]/20 bg-[#091014]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName || title}
                className="mx-auto max-h-44 w-full object-contain"
              />
            </div>
            <p className="max-w-xs truncate text-center text-sm font-medium text-[#94D4B9]">
              {fileName}
            </p>
            <span className="rounded-full border border-[#94D4B9] px-8 py-2.5 text-xs font-semibold tracking-wide text-[#94D4B9] transition-colors group-hover:bg-[#94D4B9]/10">
              {changeLabel}
            </span>
          </>
        ) : (
          <>
            <div className="relative flex size-20 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border border-[#94D4B9]/20"
                aria-hidden
              />
              <span className="flex size-14 items-center justify-center rounded-full border border-[#94D4B9]/45 bg-[#091014] shadow-[inset_0_0_24px_rgba(148,212,185,0.06)]">
                <Plus
                  className="size-7 text-[#94D4B9]"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </div>

            <div className="space-y-1 text-center">
              <p className="font-poppins text-lg font-semibold text-[#94D4B9]">
                {title}
              </p>
              <p className="text-sm text-[#94D4B9]/75">{subtitle}</p>
            </div>

            <span className="rounded-full border border-[#94D4B9] px-8 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#94D4B9] transition-colors group-hover:bg-[#94D4B9]/10">
              {buttonLabel}
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
              setFileName("");
              setPreviewUrl(null);
              return;
            }

            setFileName(file.name);
            setPreviewUrl((current) => {
              if (current) {
                URL.revokeObjectURL(current);
              }
              return URL.createObjectURL(file);
            });
          }}
        />
      </label>

      {hint ? (
        <p className="text-center text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
