"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import type { RequestPhotoRow } from "@/lib/request-photos-queries";
import { useLocale } from "@/lib/i18n/locale-context";

type ServiceRequestPhotosPanelProps = {
  requestId: string;
  photos: RequestPhotoRow[];
};

function serviceRequestPhotoApiUrl(
  requestId: string,
  photoId: string,
  download = false,
): string {
  const params = new URLSearchParams({ requestId, photoId });
  if (download) {
    params.set("download", "1");
  }
  return `/api/service-request-photo?${params.toString()}`;
}

export function ServiceRequestPhotosPanel({
  requestId,
  photos,
}: ServiceRequestPhotosPanelProps) {
  const { messages: t } = useLocale();
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-medium text-muted">{t.common.attachedPhotos}</p>
        <p className="mt-1 text-sm text-muted">{t.common.noAttachedPhoto}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-medium text-muted">
        {photos.length === 1 ? t.common.attachedPhoto : t.common.attachedPhotos}
      </p>
      <div className="mt-3 space-y-4">
        {photos.map((photo) => {
          const failed = failedIds.has(photo.id);
          const src = serviceRequestPhotoApiUrl(requestId, photo.id);

          return (
            <div key={photo.id} className="space-y-2">
              {failed ? (
                <p className="text-sm text-red-400">{t.common.photoLoadError}</p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={t.common.attachedPhoto}
                  className="max-h-72 w-full rounded-xl border border-border object-contain"
                  onError={() =>
                    setFailedIds((current) => new Set(current).add(photo.id))
                  }
                />
              )}
              <a
                href={serviceRequestPhotoApiUrl(requestId, photo.id, true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Download className="size-4 shrink-0" aria-hidden />
                {t.common.downloadPhoto}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
