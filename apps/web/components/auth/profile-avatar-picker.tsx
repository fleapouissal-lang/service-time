"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import { resolveProfileAvatarSrc } from "@/lib/profile-avatar-url";
import {
  loginHintClass,
  loginLabelClass,
  loginLinkClass,
} from "@/lib/login-styles";
import { cn } from "@/lib/utils";

type ProfileAvatarPickerProps = {
  name?: string;
  label?: string;
  hint?: string;
  className?: string;
  defaultAvatarUrl?: string | null;
  defaultUserId?: string;
  defaultAvatarVersion?: string | null;
  onChange?: (file: File | null) => void;
};

export function ProfileAvatarPicker({
  name = "avatar",
  label,
  hint,
  className,
  defaultAvatarUrl = null,
  defaultUserId,
  defaultAvatarVersion,
  onChange,
}: ProfileAvatarPickerProps) {
  const { messages: t } = useLocale();
  const resolvedLabel = label ?? t.register.avatarLabel;
  const resolvedHint = hint ?? t.register.avatarHint;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const displayUrl =
    preview ??
    (defaultUserId && defaultAvatarUrl
      ? resolveProfileAvatarSrc(
          defaultUserId,
          defaultAvatarUrl,
          defaultAvatarVersion,
        )
      : defaultAvatarUrl);

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
      <p className={cn("text-sm font-medium", loginLabelClass)}>{resolvedLabel}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#94D4B9]/50 bg-[#94D4B9]/5 transition-colors hover:border-[#94D4B9] hover:bg-[#94D4B9]/10"
          aria-label={resolvedLabel}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Camera className={cn("size-7", iconAccentClass)} aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn("text-sm font-semibold hover:underline", loginLinkClass)}
          >
            {preview ? t.register.avatarChange : t.register.avatarChoose}
          </button>
          {fileName ? (
            <p className={cn("mt-1 truncate text-xs", loginHintClass)} dir="ltr">
              {fileName}
            </p>
          ) : (
            <p className={cn("mt-1 text-xs", loginHintClass)}>{resolvedHint}</p>
          )}
          {preview ? (
            <button
              type="button"
              onClick={clearSelection}
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-300 hover:underline"
            >
              <X className="size-3" aria-hidden />
              {t.register.avatarRemove}
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
