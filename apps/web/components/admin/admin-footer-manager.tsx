"use client";

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
  deleteFooterLinkAction,
  moveFooterLinkAction,
  saveFooterContentAction,
  saveFooterLinkAction,
  toggleFooterLinkAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  AdminFooterContent,
  AdminFooterLink,
  FooterLinkGroup,
} from "@/lib/footer-content-shared";
import { cn } from "@/lib/utils";

type AdminFooterManagerProps = {
  content: AdminFooterContent;
};

function fieldClass() {
  return "h-11 rounded-xl border border-border bg-background px-3";
}

function FooterContentForm({ content }: { content: AdminFooterContent }) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.footerPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveFooterContentAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.brandTitleAr}</span>
          <input
            name="brand_title_ar"
            defaultValue={content.brand_title_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.brandTitleEn}</span>
          <input
            name="brand_title_en"
            defaultValue={content.brand_title_en}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">{p.taglineAr}</span>
          <textarea
            name="tagline_ar"
            rows={3}
            defaultValue={content.tagline_ar}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">{p.taglineEn}</span>
          <textarea
            name="tagline_en"
            rows={3}
            defaultValue={content.tagline_en}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.phone}</span>
          <input
            name="phone"
            dir="ltr"
            defaultValue={content.phone}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.email}</span>
          <input
            name="email"
            type="email"
            dir="ltr"
            defaultValue={content.email}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.locationAr}</span>
          <input
            name="location_ar"
            defaultValue={content.location_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.locationEn}</span>
          <input
            name="location_en"
            defaultValue={content.location_en}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.rightsAr}</span>
          <input
            name="rights_ar"
            defaultValue={content.rights_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.rightsEn}</span>
          <input
            name="rights_en"
            defaultValue={content.rights_en}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionQuickAr}</span>
          <input
            name="section_quick_ar"
            defaultValue={content.section_quick_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionQuickEn}</span>
          <input
            name="section_quick_en"
            defaultValue={content.section_quick_en}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionLegalAr}</span>
          <input
            name="section_legal_ar"
            defaultValue={content.section_legal_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionLegalEn}</span>
          <input
            name="section_legal_en"
            defaultValue={content.section_legal_en}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionContactAr}</span>
          <input
            name="section_contact_ar"
            defaultValue={content.section_contact_ar}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sectionContactEn}</span>
          <input
            name="section_contact_en"
            defaultValue={content.section_contact_en}
            className={fieldClass()}
          />
        </label>
      </div>

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

      <PendingSubmitButton pending={pending} pendingLabel={messages.common.saving}>
        {p.saveChanges}
      </PendingSubmitButton>
    </form>
  );
}

function FooterLinkForm({
  group,
  link,
  onDone,
}: {
  group: FooterLinkGroup;
  link?: AdminFooterLink | null;
  onDone?: () => void;
}) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.footerPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveFooterLinkAction, {});

  useEffect(() => {
    if (state.success) {
      onDone?.();
      router.refresh();
    }
  }, [state.success, onDone, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="group" value={group} />
      {link ? <input type="hidden" name="id" value={link.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">{p.href}</span>
          <input
            name="href"
            required
            defaultValue={link?.href ?? "/"}
            placeholder="/services"
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.labelAr}</span>
          <input
            name="label_ar"
            defaultValue={link?.label_ar ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.labelEn}</span>
          <input
            name="label_en"
            defaultValue={link?.label_en ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sortOrder}</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={link?.sort_order ?? 0}
            className={fieldClass()}
          />
        </label>
        <label className="flex items-center gap-2 self-end text-sm font-medium">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={link?.is_active ?? true}
            className="size-4 rounded border-border"
          />
          {p.active}
        </label>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <PendingSubmitButton pending={pending} pendingLabel={messages.common.saving}>
          {link ? p.saveChanges : p.addLink}
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

function FooterLinksSection({
  group,
  title,
  links,
}: {
  group: FooterLinkGroup;
  title: string;
  links: AdminFooterLink[];
}) {
  const { messages, locale } = useLocale();
  const p = messages.dashboard.admin.footerPage;
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const deleteTarget = links.find((item) => item.id === deleteId) ?? null;

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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          size="sm"
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
              {p.showAddLink}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd ? (
          <div className="rounded-xl border border-border p-4">
            <FooterLinkForm group={group} onDone={() => setShowAdd(false)} />
          </div>
        ) : null}

        {actionError ? (
          <p className="text-sm text-red-600" role="alert">
            {actionError}
          </p>
        ) : null}

        {links.length === 0 ? (
          <p className="text-sm text-muted">{p.emptyLinks}</p>
        ) : (
          links.map((link, index) => {
            const isEditing = editingId === link.id;
            const label =
              locale === "en"
                ? link.label_en || link.label_ar
                : link.label_ar || link.label_en;

            return (
              <div
                key={link.id}
                className={cn(
                  "rounded-xl border border-border p-4",
                  !link.is_active && "opacity-70",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          link.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {link.is_active ? p.statusActive : p.statusHidden}
                      </span>
                      <span className="text-xs text-muted">
                        {p.sortOrder}: {link.sort_order + 1}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold">{label}</p>
                    <p className="truncate text-xs text-muted" dir="ltr">
                      {link.href}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || index === 0}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("group", group);
                        fd.set("id", link.id);
                        fd.set("direction", "up");
                        runAction(moveFooterLinkAction, fd);
                      }}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                      {p.moveUp}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || index === links.length - 1}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("group", group);
                        fd.set("id", link.id);
                        fd.set("direction", "down");
                        runAction(moveFooterLinkAction, fd);
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
                        fd.set("group", group);
                        fd.set("id", link.id);
                        runAction(toggleFooterLinkAction, fd);
                      }}
                    >
                      {link.is_active ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                      {link.is_active ? p.hide : p.show}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setShowAdd(false);
                        setEditingId(isEditing ? null : link.id);
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
                      onClick={() => setDeleteId(link.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {p.delete}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <FooterLinkForm
                      group={group}
                      link={link}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace(
          "{name}",
          deleteTarget
            ? locale === "en"
              ? deleteTarget.label_en || deleteTarget.label_ar || deleteTarget.href
              : deleteTarget.label_ar || deleteTarget.label_en || deleteTarget.href
            : "",
        )}
        cancelLabel={messages.common.cancel}
        confirmLabel={p.delete}
        loadingLabel={messages.common.loading}
        pending={pending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const fd = new FormData();
          fd.set("group", group);
          fd.set("id", deleteTarget.id);
          runAction(deleteFooterLinkAction, fd);
        }}
      />
    </Card>
  );
}

export function AdminFooterManager({ content }: AdminFooterManagerProps) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.footerPage;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{p.hint}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{p.contentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <FooterContentForm content={content} />
        </CardContent>
      </Card>

      <FooterLinksSection
        group="quick"
        title={p.quickLinksTitle}
        links={content.quick_links}
      />
      <FooterLinksSection
        group="legal"
        title={p.legalLinksTitle}
        links={content.legal_links}
      />
    </div>
  );
}
