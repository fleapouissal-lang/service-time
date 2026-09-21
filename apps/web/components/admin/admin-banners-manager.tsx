"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  deleteHeroBannerAction,
  moveHeroBannerAction,
  saveHeroBannerAction,
  toggleHeroBannerAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AdminHeroBanner } from "@/lib/hero-banners-shared";
import { cn } from "@/lib/utils";

type AdminBannersManagerProps = {
  banners: AdminHeroBanner[];
};

function BannerImageFields({
  banner,
  labels,
}: {
  banner?: AdminHeroBanner | null;
  labels: {
    desktopAr: string;
    desktopEn: string;
    mobileAr: string;
    mobileEn: string;
    changeImage: string;
  };
}) {
  const slots = [
    {
      key: "image_desktop_ar",
      label: labels.desktopAr,
      value: banner?.image_desktop_ar ?? "",
    },
    {
      key: "image_desktop_en",
      label: labels.desktopEn,
      value: banner?.image_desktop_en ?? "",
    },
    {
      key: "image_mobile_ar",
      label: labels.mobileAr,
      value: banner?.image_mobile_ar ?? "",
    },
    {
      key: "image_mobile_en",
      label: labels.mobileEn,
      value: banner?.image_mobile_en ?? "",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {slots.map((slot) => (
        <div key={slot.key} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{slot.label}</p>
          <input type="hidden" name={slot.key} value={slot.value} />
          <PhotoUploadField
            id={`${slot.key}_${banner?.id ?? "new"}`}
            name={`${slot.key}_file`}
            title={slot.label}
            changeLabel={labels.changeImage}
            defaultPreviewUrl={slot.value || null}
            compact
          />
        </div>
      ))}
    </div>
  );
}

function BannerForm({
  banner,
  onDone,
}: {
  banner?: AdminHeroBanner | null;
  onDone?: () => void;
}) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.bannersPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveHeroBannerAction, {});

  useEffect(() => {
    if (state.success) {
      onDone?.();
      router.refresh();
    }
  }, [state.success, onDone, router]);

  return (
    <form action={action} className="space-y-4">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.href}</span>
          <input
            name="href"
            required
            defaultValue={banner?.href ?? "/request"}
            placeholder="/request"
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sortOrder}</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={banner?.sort_order ?? 0}
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.altAr}</span>
          <input
            name="alt_ar"
            defaultValue={banner?.alt_ar ?? ""}
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.altEn}</span>
          <input
            name="alt_en"
            defaultValue={banner?.alt_en ?? ""}
            className="h-11 rounded-xl border border-border bg-background px-3"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={banner?.is_active ?? true}
          className="size-4 rounded border-border"
        />
        {p.active}
      </label>

      <BannerImageFields
        banner={banner}
        labels={{
          desktopAr: p.imageDesktopAr,
          desktopEn: p.imageDesktopEn,
          mobileAr: p.imageMobileAr,
          mobileEn: p.imageMobileEn,
          changeImage: p.changeImage,
        }}
      />

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600" role="status">
          {p.saveSuccess}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <PendingSubmitButton pending={pending} pendingLabel={messages.common.saving}>
          {banner ? p.saveChanges : p.addBanner}
        </PendingSubmitButton>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
            {messages.common.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AdminBannersManager({ banners }: AdminBannersManagerProps) {
  const { messages, locale } = useLocale();
  const p = messages.dashboard.admin.bannersPage;
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteTarget = banners.find((item) => item.id === deleteId) ?? null;

  function runAction(
    action: (formData: FormData) => Promise<{ success?: boolean; error?: string }>,
    formData: FormData,
  ) {
    setActionError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{p.hint}</p>
        <Button
          type="button"
          onClick={() => {
            setShowAdd((open) => !open);
            setEditingId(null);
          }}
        >
          {showAdd ? (
            p.hideAddForm
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              {p.showAddForm}
            </>
          )}
        </Button>
      </div>

      {showAdd ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4" aria-hidden />
              {p.addBanner}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BannerForm onDone={() => setShowAdd(false)} />
          </CardContent>
        </Card>
      ) : null}

      {actionError ? (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="space-y-4">
        {banners.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted">
              {p.empty}
            </CardContent>
          </Card>
        ) : (
          banners.map((banner, index) => {
            const preview =
              locale === "en"
                ? banner.image_desktop_en || banner.image_desktop_ar
                : banner.image_desktop_ar || banner.image_desktop_en;
            const isEditing = editingId === banner.id;

            return (
              <Card key={banner.id} className={cn(!banner.is_active && "opacity-70")}>
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-border bg-muted/30 sm:h-24 sm:w-44 shrink-0">
                      {preview ? (
                        <Image
                          src={preview}
                          alt={banner.alt_ar || banner.alt_en || banner.href}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted">
                          <ImageIcon className="size-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            banner.is_active
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                          )}
                        >
                          {banner.is_active ? p.statusActive : p.statusHidden}
                        </span>
                        <span className="text-xs text-muted">
                          {p.sortOrder}: {banner.sort_order + 1}
                        </span>
                      </div>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {banner.href}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {locale === "en"
                          ? banner.alt_en || banner.alt_ar
                          : banner.alt_ar || banner.alt_en}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending || index === 0}
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("id", banner.id);
                            fd.set("direction", "up");
                            runAction(moveHeroBannerAction, fd);
                          }}
                        >
                          <ArrowUp className="size-4" aria-hidden />
                          {p.moveUp}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending || index === banners.length - 1}
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("id", banner.id);
                            fd.set("direction", "down");
                            runAction(moveHeroBannerAction, fd);
                          }}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                          {p.moveDown}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("id", banner.id);
                            runAction(toggleHeroBannerAction, fd);
                          }}
                        >
                          {banner.is_active ? (
                            <EyeOff className="size-4" aria-hidden />
                          ) : (
                            <Eye className="size-4" aria-hidden />
                          )}
                          {banner.is_active ? p.hide : p.show}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setShowAdd(false);
                            setEditingId(isEditing ? null : banner.id);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden />
                          {p.edit}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-600 hover:bg-red-500/10"
                          disabled={pending}
                          onClick={() => setDeleteId(banner.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          {p.delete}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="border-t border-border pt-4">
                      <BannerForm
                        banner={banner}
                        onDone={() => setEditingId(null)}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace(
          "{name}",
          deleteTarget?.href ?? "",
        )}
        cancelLabel={messages.common.cancel}
        confirmLabel={p.delete}
        loadingLabel={messages.common.loading}
        pending={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const fd = new FormData();
          fd.set("id", deleteTarget.id);
          runAction(deleteHeroBannerAction, fd);
        }}
      />
    </div>
  );
}
