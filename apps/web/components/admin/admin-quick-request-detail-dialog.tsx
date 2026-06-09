"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getQuickRequestPhotoSignedUrlAction } from "@/app/admin/actions";
import type { QuickRequestRow } from "@/lib/quick-requests-queries";
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminQuickRequestDetailDialogProps = {
  request: QuickRequestRow | null;
  onClose: () => void;
};

export function AdminQuickRequestDetailDialog({
  request,
  onClose,
}: AdminQuickRequestDetailDialogProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.quickRequestsPage;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!request) {
      setPhotoUrl(null);
      setPhotoError(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [request, onClose]);

  useEffect(() => {
    if (!request?.photo_storage_path) {
      setPhotoUrl(null);
      setPhotoError(false);
      setPhotoLoading(false);
      return;
    }

    let cancelled = false;
    setPhotoLoading(true);
    setPhotoError(false);
    setPhotoUrl(null);

    void getQuickRequestPhotoSignedUrlAction(request.photo_storage_path).then(
      (result) => {
        if (cancelled) return;
        if ("url" in result) {
          setPhotoUrl(result.url);
        } else {
          setPhotoError(true);
        }
        setPhotoLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [request?.id, request?.photo_storage_path]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-request-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={p.detailClose}
        onClick={onClose}
      />

      <div className="scrollbar-theme relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-muted/10"
          aria-label={p.detailClose}
        >
          <X className="size-4" aria-hidden />
        </button>

        <h2 id="quick-request-detail-title" className="pe-10 text-lg font-semibold">
          {p.detailTitle}
        </h2>

        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted">{p.detailContact}</dt>
            <dd className="mt-1 space-y-0.5">
              <p className="font-semibold">{request.name}</p>
              <p dir="ltr" className="tabular-nums">
                {request.phone}
              </p>
              {request.email ? (
                <p dir="ltr" className="break-all text-muted">
                  {request.email}
                </p>
              ) : null}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-muted">{p.detailMessage}</dt>
            <dd className="mt-1 whitespace-pre-wrap leading-relaxed">{request.message}</dd>
          </div>

          <div>
            <dt className="font-medium text-muted">{p.detailDate}</dt>
            <dd className="mt-1 tabular-nums" dir="ltr">
              {formatDateTime(request.created_at, locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-muted">{p.detailAccount}</dt>
            <dd className="mt-1">
              {request.client_id ? (
                <Link
                  href={`/admin/users/${request.client_id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {p.table.viewClient}
                </Link>
              ) : (
                <span className="text-muted">—</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-muted">{p.detailPhoto}</dt>
            <dd className="mt-2">
              {!request.photo_storage_path ? (
                <span className="text-muted">{p.detailNoPhoto}</span>
              ) : photoLoading ? (
                <span className="text-muted">{t.common.loading}</span>
              ) : photoError || !photoUrl ? (
                <span className="text-red-400">{p.detailPhotoError}</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={p.detailPhoto}
                  className="max-h-72 w-full rounded-xl border border-border object-contain"
                />
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
