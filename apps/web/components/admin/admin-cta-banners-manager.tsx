"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  deleteCtaBannerAction,
  moveCtaBannerAction,
  saveCtaBannerAction,
  toggleCtaBannerAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AdminCtaBanner } from "@/lib/cta-banners-shared";
import { cn } from "@/lib/utils";

type AdminCtaBannersManagerProps = {
  banners: AdminCtaBanner[];
};

function CtaBannerForm({
  banner,
  onDone,
}: {
  banner?: AdminCtaBanner | null;
  onDone?: () => void;
}) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.ctaBannersPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveCtaBannerAction, {});

  useEffect(() => {
    if (!state.success) return;
    router.refresh();
    onDone?.();
  }, [state.success, router, onDone]);

  return (
    <form action={action} className="space-y-4">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`title_before_ar_${banner?.id ?? "new"}`}>
            {p.titleBeforeAr}
          </Label>
          <Input
            id={`title_before_ar_${banner?.id ?? "new"}`}
            name="title_before_ar"
            required
            defaultValue={banner?.title_before_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`title_before_en_${banner?.id ?? "new"}`}>
            {p.titleBeforeEn}
          </Label>
          <Input
            id={`title_before_en_${banner?.id ?? "new"}`}
            name="title_before_en"
            defaultValue={banner?.title_before_en ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`title_highlight_ar_${banner?.id ?? "new"}`}>
            {p.titleHighlightAr}
          </Label>
          <Input
            id={`title_highlight_ar_${banner?.id ?? "new"}`}
            name="title_highlight_ar"
            defaultValue={banner?.title_highlight_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`title_highlight_en_${banner?.id ?? "new"}`}>
            {p.titleHighlightEn}
          </Label>
          <Input
            id={`title_highlight_en_${banner?.id ?? "new"}`}
            name="title_highlight_en"
            defaultValue={banner?.title_highlight_en ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description_ar_${banner?.id ?? "new"}`}>
            {p.descriptionAr}
          </Label>
          <Textarea
            id={`description_ar_${banner?.id ?? "new"}`}
            name="description_ar"
            rows={3}
            defaultValue={banner?.description_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`description_en_${banner?.id ?? "new"}`}>
            {p.descriptionEn}
          </Label>
          <Textarea
            id={`description_en_${banner?.id ?? "new"}`}
            name="description_en"
            rows={3}
            defaultValue={banner?.description_en ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cta_label_ar_${banner?.id ?? "new"}`}>
            {p.ctaLabelAr}
          </Label>
          <Input
            id={`cta_label_ar_${banner?.id ?? "new"}`}
            name="cta_label_ar"
            defaultValue={banner?.cta_label_ar ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`cta_label_en_${banner?.id ?? "new"}`}>
            {p.ctaLabelEn}
          </Label>
          <Input
            id={`cta_label_en_${banner?.id ?? "new"}`}
            name="cta_label_en"
            defaultValue={banner?.cta_label_en ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`href_${banner?.id ?? "new"}`}>{p.href}</Label>
          <Input
            id={`href_${banner?.id ?? "new"}`}
            name="href"
            dir="ltr"
            placeholder="/request"
            defaultValue={banner?.href ?? "/request"}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`sort_order_${banner?.id ?? "new"}`}>
            {p.sortOrder}
          </Label>
          <Input
            id={`sort_order_${banner?.id ?? "new"}`}
            name="sort_order"
            type="number"
            min={0}
            step={1}
            defaultValue={banner?.sort_order ?? 0}
            className="mt-1 max-w-[8rem]"
            dir="ltr"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">{p.imageAr}</p>
          <input type="hidden" name="image_ar" value={banner?.image_ar ?? ""} />
          <PhotoUploadField
            id={`image_ar_${banner?.id ?? "new"}`}
            name="image_ar_file"
            title={p.imageAr}
            changeLabel={p.changeImage}
            defaultPreviewUrl={banner?.image_ar || null}
            compact
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{p.imageEn}</p>
          <input type="hidden" name="image_en" value={banner?.image_en ?? ""} />
          <PhotoUploadField
            id={`image_en_${banner?.id ?? "new"}`}
            name="image_en_file"
            title={p.imageEn}
            changeLabel={p.changeImage}
            defaultPreviewUrl={banner?.image_en || null}
            compact
          />
        </div>
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

      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-primary" role="status">
          {p.saveSuccess}
        </p>
      ) : null}

      <PendingSubmitButton pending={pending} pendingLabel={messages.common.saving}>
        {banner ? p.saveChanges : p.addBanner}
      </PendingSubmitButton>
    </form>
  );
}

export function AdminCtaBannersManager({
  banners,
}: AdminCtaBannersManagerProps) {
  const { messages, locale } = useLocale();
  const p = messages.dashboard.admin.ctaBannersPage;
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function runAction(
    action: (formData: FormData) => Promise<unknown>,
    formData: FormData,
  ) {
    startTransition(() => {
      void action(formData).then(() => router.refresh());
    });
  }

  const sorted = banners
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const deleteTarget = sorted.find((item) => item.id === deleteId) ?? null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{p.hint}</p>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h2 className="font-semibold">{p.sectionTitle}</h2>
            <p className="mt-1 text-sm text-muted">{p.sectionHint}</p>
          </div>
          <Button
            type="button"
            variant={showAdd ? "outline" : "default"}
            onClick={() => setShowAdd((value) => !value)}
          >
            <Plus className="size-4" aria-hidden />
            {showAdd ? p.hideAddForm : p.addBanner}
          </Button>
        </CardContent>
        {showAdd ? (
          <CardContent className="border-t border-border pt-0">
            <CtaBannerForm onDone={() => setShowAdd(false)} />
          </CardContent>
        ) : null}
      </Card>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">{p.empty}</p>
      ) : (
        <div className="space-y-4">
          {sorted.map((banner, index) => {
            const title =
              locale === "en"
                ? `${banner.title_before_en} ${banner.title_highlight_en}`.trim() ||
                  banner.title_before_ar
                : `${banner.title_before_ar} ${banner.title_highlight_ar}`.trim();
            const preview = banner.image_ar || banner.image_en;
            const isEditing = editingId === banner.id;

            return (
              <Card key={banner.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/20">
                      {preview ? (
                        <Image
                          src={preview}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{title}</CardTitle>
                      <p className="mt-1 text-xs text-muted" dir="ltr">
                        {banner.href}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-medium",
                          banner.is_active ? "text-primary" : "text-muted",
                        )}
                      >
                        {banner.is_active ? p.statusActive : p.statusHidden}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={index === 0}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", banner.id);
                        fd.set("direction", "up");
                        runAction(moveCtaBannerAction, fd);
                      }}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                      {p.moveUp}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={index === sorted.length - 1}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", banner.id);
                        fd.set("direction", "down");
                        runAction(moveCtaBannerAction, fd);
                      }}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                      {p.moveDown}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", banner.id);
                        runAction(toggleCtaBannerAction, fd);
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
                      onClick={() =>
                        setEditingId(isEditing ? null : banner.id)
                      }
                    >
                      <Pencil className="size-4" aria-hidden />
                      {p.edit}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-400"
                      onClick={() => setDeleteId(banner.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {p.delete}
                    </Button>
                  </div>
                </CardHeader>
                {isEditing ? (
                  <CardContent className="border-t border-border">
                    <CtaBannerForm
                      banner={banner}
                      onDone={() => setEditingId(null)}
                    />
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace(
          "{name}",
          deleteTarget
            ? locale === "en"
              ? `${deleteTarget.title_before_en} ${deleteTarget.title_highlight_en}`.trim() ||
                deleteTarget.title_before_ar
              : `${deleteTarget.title_before_ar} ${deleteTarget.title_highlight_ar}`.trim()
            : "",
        )}
        cancelLabel={messages.common.cancel}
        confirmLabel={p.delete}
        loadingLabel={messages.common.loading}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const fd = new FormData();
          fd.set("id", deleteTarget.id);
          runAction(deleteCtaBannerAction, fd);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
