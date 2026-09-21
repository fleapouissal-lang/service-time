"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteLegalPageAction,
  saveLegalPageAction,
  toggleLegalPageAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  createLegalSectionId,
  paragraphsToTextarea,
  type AdminLegalPage,
  type AdminLegalSection,
} from "@/lib/legal-pages-shared";
import { cn } from "@/lib/utils";

type AdminLegalPagesManagerProps = {
  pages: AdminLegalPage[];
};

function fieldClass() {
  return "h-11 rounded-xl border border-border bg-background px-3";
}

function emptySection(): AdminLegalSection {
  return {
    id: `new_${createLegalSectionId()}`,
    title_ar: "",
    title_en: "",
    paragraphs_ar: [],
    paragraphs_en: [],
  };
}

function LegalPageForm({
  page,
  onDone,
}: {
  page?: AdminLegalPage | null;
  onDone?: () => void;
}) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.legalPagesPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveLegalPageAction, {});
  const [sections, setSections] = useState<AdminLegalSection[]>(
    page?.sections?.length ? page.sections : [emptySection()],
  );

  useEffect(() => {
    if (state.success) {
      onDone?.();
      router.refresh();
    }
  }, [state.success, onDone, router]);

  return (
    <form action={action} className="space-y-4">
      {page ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.slug}</span>
          <input
            name="slug"
            required
            dir="ltr"
            defaultValue={page?.slug ?? ""}
            placeholder="privacy"
            className={fieldClass()}
          />
          <span className="text-xs text-muted">{p.slugHint}</span>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.sortOrder}</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={page?.sort_order ?? 0}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.eyebrowAr}</span>
          <input
            name="eyebrow_ar"
            defaultValue={page?.eyebrow_ar ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.eyebrowEn}</span>
          <input
            name="eyebrow_en"
            defaultValue={page?.eyebrow_en ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.titleAr}</span>
          <input
            name="title_ar"
            defaultValue={page?.title_ar ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">{p.titleEn}</span>
          <input
            name="title_en"
            defaultValue={page?.title_en ?? ""}
            className={fieldClass()}
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">{p.introAr}</span>
          <textarea
            name="intro_ar"
            rows={3}
            defaultValue={page?.intro_ar ?? ""}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">{p.introEn}</span>
          <textarea
            name="intro_en"
            rows={3}
            defaultValue={page?.intro_en ?? ""}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={page?.is_active ?? true}
            className="size-4 rounded border-border"
          />
          {p.active}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{p.sectionsTitle}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSections((prev) => [...prev, emptySection()])}
          >
            <Plus className="size-4" aria-hidden />
            {p.addSection}
          </Button>
        </div>
        <p className="text-xs text-muted">{p.sectionsHint}</p>

        {sections.map((section, index) => (
          <div
            key={section.id}
            className="space-y-3 rounded-xl border border-border p-4"
          >
            <input type="hidden" name="section_id" value={section.id} />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {p.sectionLabel.replace("{n}", String(index + 1))}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-500/40 text-red-600"
                disabled={sections.length <= 1}
                onClick={() =>
                  setSections((prev) => prev.filter((item) => item.id !== section.id))
                }
              >
                {p.removeSection}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{p.sectionTitleAr}</span>
                <input
                  name={`section_title_ar_${section.id}`}
                  defaultValue={section.title_ar}
                  className={fieldClass()}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{p.sectionTitleEn}</span>
                <input
                  name={`section_title_en_${section.id}`}
                  defaultValue={section.title_en}
                  className={fieldClass()}
                />
              </label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">{p.sectionBodyAr}</span>
                <textarea
                  name={`section_body_ar_${section.id}`}
                  rows={5}
                  defaultValue={paragraphsToTextarea(section.paragraphs_ar)}
                  className="rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">{p.sectionBodyEn}</span>
                <textarea
                  name={`section_body_en_${section.id}`}
                  rows={5}
                  defaultValue={paragraphsToTextarea(section.paragraphs_en)}
                  className="rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
          </div>
        ))}
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

      <div className="flex flex-wrap gap-2">
        <PendingSubmitButton pending={pending} pendingLabel={messages.common.saving}>
          {page ? p.saveChanges : p.addPage}
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

export function AdminLegalPagesManager({ pages }: AdminLegalPagesManagerProps) {
  const { messages, locale } = useLocale();
  const p = messages.dashboard.admin.legalPagesPage;
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const deleteTarget = pages.find((item) => item.id === deleteId) ?? null;

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
            <CardTitle className="text-base">{p.addPage}</CardTitle>
          </CardHeader>
          <CardContent>
            <LegalPageForm onDone={() => setShowAdd(false)} />
          </CardContent>
        </Card>
      ) : null}

      {actionError ? (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="space-y-4">
        {pages.map((page) => {
          const title =
            locale === "en"
              ? page.title_en || page.title_ar
              : page.title_ar || page.title_en;
          const isEditing = editingId === page.id;

          return (
            <Card key={page.id} className={cn(!page.is_active && "opacity-70")}>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          page.is_active
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {page.is_active ? p.statusActive : p.statusHidden}
                      </span>
                      <span className="text-xs text-muted" dir="ltr">
                        /legal/{page.slug}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted">
                      {p.sectionsCount.replace(
                        "{count}",
                        String(page.sections.length),
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", page.id);
                        runAction(toggleLegalPageAction, fd);
                      }}
                    >
                      {page.is_active ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                      {page.is_active ? p.hide : p.show}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setShowAdd(false);
                        setEditingId(isEditing ? null : page.id);
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
                      onClick={() => setDeleteId(page.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {p.delete}
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="border-t border-border pt-4">
                    <LegalPageForm
                      page={page}
                      onDone={() => setEditingId(null)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace(
          "{name}",
          deleteTarget
            ? locale === "en"
              ? deleteTarget.title_en || deleteTarget.title_ar || deleteTarget.slug
              : deleteTarget.title_ar || deleteTarget.title_en || deleteTarget.slug
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
          fd.set("id", deleteTarget.id);
          runAction(deleteLegalPageAction, fd);
        }}
      />
    </div>
  );
}
