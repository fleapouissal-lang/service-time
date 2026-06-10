"use client";

import Link from "next/link";
import { CheckCircle2, Clock, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  getQuickRequestPhotoSignedUrlAction,
  setQuickRequestAdminReadStatusAction,
} from "@/app/admin/actions";
import { getClientQuickRequestPhotoUrlAction } from "@/app/client/quick-request-actions";
import { Button } from "@/components/ui/button";
import type { QuickRequestRow } from "@/lib/quick-requests-queries";
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";

type QuickRequestDetailDialogProps = {
  request: QuickRequestRow | null;
  onClose: () => void;
  variant: "admin" | "client";
  isRead?: boolean;
  onReadStatusChange?: (read: boolean, adminReadAt: string | null) => void;
};

export function QuickRequestDetailDialog({
  request,
  onClose,
  variant,
  isRead,
  onReadStatusChange,
}: QuickRequestDetailDialogProps) {
  const { locale, messages: t } = useLocale();
  const adminP = t.dashboard.admin.quickRequestsPage;
  const clientP = t.dashboard.client.quickRequestsPage;
  const labels = variant === "admin" ? adminP : clientP;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [readPending, startReadTransition] = useTransition();

  const resolvedRead =
    variant === "admin"
      ? (isRead ?? Boolean(request?.admin_read_at))
      : Boolean(request?.admin_read_at);

  const handleToggleReadStatus = () => {
    if (!request || variant !== "admin") return;

    const nextRead = !resolvedRead;
    startReadTransition(async () => {
      const result = await setQuickRequestAdminReadStatusAction(
        request.id,
        nextRead,
      );
      if ("ok" in result && result.ok) {
        onReadStatusChange?.(nextRead, result.admin_read_at);
      }
    });
  };

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

    const loadPhoto =
      variant === "admin"
        ? getQuickRequestPhotoSignedUrlAction(request.photo_storage_path)
        : getClientQuickRequestPhotoUrlAction(
            request.id,
            request.photo_storage_path,
          );

    void loadPhoto.then((result) => {
      if (cancelled) return;
      if ("url" in result) {
        setPhotoUrl(result.url);
      } else {
        setPhotoError(true);
      }
      setPhotoLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [request?.id, request?.photo_storage_path, variant]);

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
        aria-label={labels.detailClose}
        onClick={onClose}
      />

      <div className="scrollbar-theme relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-muted/10"
          aria-label={labels.detailClose}
        >
          <X className="size-4" aria-hidden />
        </button>

        <h2 id="quick-request-detail-title" className="pe-10 text-lg font-semibold">
          {labels.detailTitle}
        </h2>

        <dl className="mt-5 space-y-4 text-sm">
          {variant === "admin" ? (
            <div>
              <dt className="font-medium text-muted">{adminP.detailContact}</dt>
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
          ) : null}

          <div>
            <dt className="font-medium text-muted">{labels.detailMessage}</dt>
            <dd className="mt-1 whitespace-pre-wrap leading-relaxed">
              {request.message}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-muted">{labels.detailDate}</dt>
            <dd className="mt-1 tabular-nums" dir="ltr">
              {formatDateTime(request.created_at, locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>

          {variant === "client" || variant === "admin" ? (
            <div>
              <dt className="font-medium text-muted">
                {variant === "admin" ? adminP.detailStatus : clientP.detailAdminStatus}
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                {resolvedRead ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                    {variant === "admin" ? adminP.table.read : clientP.table.adminRead}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {variant === "admin" ? adminP.table.unread : clientP.table.adminPending}
                  </span>
                )}
                {variant === "admin" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={readPending}
                    onClick={handleToggleReadStatus}
                  >
                    {readPending
                      ? t.common.loading
                      : resolvedRead
                        ? adminP.markUnread
                        : adminP.markRead}
                  </Button>
                ) : null}
              </dd>
            </div>
          ) : null}

          {variant === "admin" ? (
            <div>
              <dt className="font-medium text-muted">{adminP.detailAccount}</dt>
              <dd className="mt-1">
                {request.client_id ? (
                  <Link
                    href={`/admin/users/${request.client_id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {adminP.table.viewClient}
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </dd>
            </div>
          ) : null}

          <div>
            <dt className="font-medium text-muted">{labels.detailPhoto}</dt>
            <dd className="mt-2">
              {!request.photo_storage_path ? (
                <span className="text-muted">{labels.detailNoPhoto}</span>
              ) : photoLoading ? (
                <span className="text-muted">{t.common.loading}</span>
              ) : photoError || !photoUrl ? (
                <span className="text-red-400">{labels.detailPhotoError}</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={labels.detailPhoto}
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
