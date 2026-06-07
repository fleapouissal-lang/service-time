"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileAvatarPickerProps = {
  name?: string;
  label?: string;
  hint?: string;
  className?: string;
  onChange?: (file: File | null) => void;
};

export function ProfileAvatarPicker({
  name = "avatar",
  label = "صورة الملف الشخصي",
  hint = "اختياري — JPG أو PNG أو WebP (5 MB كحد أقصى)",
  className,
  onChange,
}: ProfileAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function clearSelection() {
    setPreview(null);
    setFileName(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      clearSelection();
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    onChange?.(file);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#94D4B9]/50 bg-[#94D4B9]/5 transition-colors hover:border-[#94D4B9] hover:bg-[#94D4B9]/10"
          aria-label={label}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Camera className="size-7 text-[#94D4B9]" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-semibold text-[#94D4B9] hover:underline"
          >
            {preview ? "تغيير الصورة" : "اختيار صورة"}
          </button>
          {fileName ? (
            <p className="mt-1 truncate text-xs text-white/50" dir="ltr">
              {fileName}
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/50">{hint}</p>
          )}
          {preview ? (
            <button
              type="button"
              onClick={clearSelection}
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-300 hover:underline"
            >
              <X className="size-3" aria-hidden />
              إزالة الصورة
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) =>
          handleFileChange(e.target.files?.[0] ?? null)
        }
      />
    </div>
  );
}
