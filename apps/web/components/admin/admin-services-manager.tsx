"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminServiceCategoryAction,
  deleteVehicleClassAction,
  saveAdminServiceCategoryAction,
  saveVehicleClassAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import type { AdminCatalogCategory } from "@/lib/services-catalog-admin";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatSparePartPrice } from "@/lib/format-price";
import {
  getCatalogPriceFloor,
  type PricesByClass,
  type VehicleClassDef,
  type VehicleClassId,
} from "@/lib/vehicle-classes";
import { cn } from "@/lib/utils";

const ACTION_VALUES = [
  "full|periodic_maintenance|workshop_visit",
  "full|periodic_maintenance|mobile_workshop",
  "full|emergency|mobile_workshop",
  "full|emergency|workshop_visit",
  "link|/spare-parts",
  "link|/login?next=/client/track",
  "link|/login?next=/client/orders",
] as const;

type DraftSub = {
  key: string;
  id: string;
  label_ar: string;
  label_en: string;
  description_ar: string;
  description_en: string;
  action: string;
  price: string;
  /** Classes attached to this sub-service only (order = display order). */
  classIds: string[];
  pricesByClass: Partial<Record<VehicleClassId, string>>;
  is_active: boolean;
};

function emptyClassPrices(): Partial<Record<VehicleClassId, string>> {
  return {};
}

function toDraftClassPrices(
  pricesByClass: PricesByClass | undefined,
): Partial<Record<VehicleClassId, string>> {
  const result: Partial<Record<VehicleClassId, string>> = {};
  if (!pricesByClass) return result;
  for (const [id, value] of Object.entries(pricesByClass)) {
    if (value != null && value > 0) result[id] = String(value);
  }
  return result;
}

function toDraftSubs(
  category: AdminCatalogCategory | null | undefined,
): DraftSub[] {
  if (!category?.subOptions.length) {
    return [
      {
        key: `new_${crypto.randomUUID()}`,
        id: `new_${crypto.randomUUID()}`,
        label_ar: "",
        label_en: "",
        description_ar: "",
        description_en: "",
        action: "full|periodic_maintenance|workshop_visit",
        price: "120",
        classIds: [],
        pricesByClass: emptyClassPrices(),
        is_active: true,
      },
    ];
  }

  return category.subOptions.map((sub) => {
    const pricesByClass = toDraftClassPrices(sub.pricesByClass);
    const classIds =
      sub.classIds?.length > 0
        ? sub.classIds
        : Object.keys(pricesByClass);
    return {
      key: sub.id,
      id: sub.id,
      label_ar: sub.label_ar,
      label_en: sub.label_en,
      description_ar: sub.description_ar,
      description_en: sub.description_en,
      action: sub.action,
      price: String(sub.price ?? 0),
      classIds,
      pricesByClass,
      is_active: sub.is_active,
    };
  });
}

function actionLabel(
  action: string,
  options: Record<string, string>,
): string {
  if (action === "full|periodic_maintenance|workshop_visit") {
    return options.maintenanceWorkshop;
  }
  if (action === "full|periodic_maintenance|mobile_workshop") {
    return options.maintenanceMobile;
  }
  if (action === "full|emergency|mobile_workshop") {
    return options.emergencyMobile;
  }
  if (action === "full|emergency|workshop_visit") {
    return options.emergencyWorkshop;
  }
  if (action.startsWith("link|/spare-parts")) return options.linkSpareParts;
  if (action.includes("/client/track")) return options.linkTrack;
  if (action.includes("/client/orders")) return options.linkOrders;
  return action;
}

export function AdminServicesTable({
  categories,
}: {
  categories: AdminCatalogCategory[];
}) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const router = useRouter();
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAdminServiceCategoryAction,
    {},
  );

  useEffect(() => {
    if (!deleteState.success) return;
    router.refresh();
  }, [deleteState.success, router]);

  if (categories.length === 0) {
    return <p className="p-6 text-center text-muted">{p.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      {deleteState.error ? (
        <div
          className="mx-4 mt-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {deleteState.error}
        </div>
      ) : null}
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--muted)]/40 text-start">
          <tr>
            <th className="px-4 py-3 font-semibold">{p.table.name}</th>
            <th className="px-4 py-3 font-semibold">{p.table.subServices}</th>
            <th className="px-4 py-3 font-semibold">{p.table.status}</th>
            <th className="px-4 py-3 font-semibold">{p.table.actions}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const title =
              locale === "en"
                ? category.title_en || category.title_ar
                : category.title_ar;
            return (
              <tr
                key={category.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-primary">{title}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.parentTitleOnly}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.subCount.replace(
                    "{count}",
                    String(category.subOptions.length),
                  )}
                  <div className="mt-1 space-y-0.5 text-xs">
                    {category.subOptions.slice(0, 3).map((sub) => {
                      const floor = getCatalogPriceFloor(
                        sub.price,
                        sub.pricesByClass,
                      );
                      return (
                        <p key={sub.id}>
                          {locale === "en"
                            ? sub.label_en || sub.label_ar
                            : sub.label_ar}
                          {" · "}
                          {floor > 0
                            ? p.fromPrice.replace(
                                "{price}",
                                formatSparePartPrice(floor, locale),
                              )
                            : formatSparePartPrice(sub.price, locale)}
                        </p>
                      );
                    })}
                    {category.subOptions.length > 3 ? (
                      <p>…</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {category.is_active ? t.common.active : t.common.inactive}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/services/${category.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-card-elevated"
                    >
                      {p.table.edit}
                    </Link>
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <PendingSubmitButton
                        pending={deletePending}
                        pendingLabel={t.common.loading}
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={(event) => {
                          const ok = window.confirm(
                            p.deleteConfirmMessage.replace("{name}", title),
                          );
                          if (!ok) event.preventDefault();
                        }}
                      >
                        {p.table.delete}
                      </PendingSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VehicleClassesQuickManager({
  classes,
}: {
  classes: VehicleClassDef[];
}) {
  const router = useRouter();
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [addState, addAction, addPending] = useActionState(
    saveVehicleClassAction,
    {},
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteVehicleClassAction,
    {},
  );

  useEffect(() => {
    if (!addState.success) return;
    setAddOpen(false);
    router.refresh();
  }, [addState.success, router]);

  useEffect(() => {
    if (!deleteState.success) return;
    setDeleteId(null);
    router.refresh();
  }, [deleteState.success, router]);

  const sorted = classes
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const deleteTarget = sorted.find((row) => row.id === deleteId) ?? null;
  const error = addState.error || deleteState.error;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{p.pricesByClassTitle}</h3>
            <p className="mt-1 text-sm text-muted">{p.manageClassesHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={addOpen ? "outline" : "default"}
              onClick={() => setAddOpen((value) => !value)}
            >
              {addOpen ? (
                <>
                  <ChevronDown className="size-4 rotate-180" aria-hidden />
                  {p.hideAddClass}
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  {p.addVehicleClass}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {sorted.map((row) => {
            const label = locale === "en" ? row.nameEn || row.nameAr : row.nameAr;
            return (
              <div
                key={row.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm",
                  row.is_active
                    ? "border-border bg-muted/20"
                    : "border-dashed border-border/70 text-muted",
                )}
              >
                <span>{label}</span>
                {!row.is_active ? (
                  <span className="text-xs text-muted">({t.common.inactive})</span>
                ) : null}
                <button
                  type="button"
                  className="rounded-md p-0.5 text-red-400 hover:bg-red-950/30"
                  aria-label={`${p.removeVehicleClass} ${label}`}
                  onClick={() => setDeleteId(row.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            );
          })}
          {sorted.length === 0 ? (
            <p className="text-sm text-muted">{p.noVehicleClasses}</p>
          ) : null}
        </div>

        {addOpen ? (
          <form action={addAction} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <input type="hidden" name="is_active" value="on" />
            <input type="hidden" name="sort_order" value={sorted.length} />
            <div>
              <Label htmlFor="quick_class_name_ar">{p.classNameAr}</Label>
              <Input
                id="quick_class_name_ar"
                name="name_ar"
                required
                className="mt-1"
                placeholder={p.classNameArPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="quick_class_name_en">{p.classNameEn}</Label>
              <Input
                id="quick_class_name_en"
                name="name_en"
                className="mt-1"
                placeholder={p.classNameEnPlaceholder}
              />
            </div>
            <div className="sm:col-span-2">
              <PendingSubmitButton pending={addPending} pendingLabel={t.common.saving}>
                {p.addVehicleClass}
              </PendingSubmitButton>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <AdminConfirmDialog
          open={Boolean(deleteTarget)}
          title={p.removeClassConfirmTitle}
          message={p.removeClassConfirmMessage.replace(
            "{name}",
            deleteTarget
              ? locale === "en"
                ? deleteTarget.nameEn || deleteTarget.nameAr
                : deleteTarget.nameAr
              : "",
          )}
          cancelLabel={t.common.cancel}
          confirmLabel={p.removeVehicleClass}
          loadingLabel={t.common.loading}
          pending={deletePending}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            const fd = new FormData();
            fd.set("id", deleteTarget.id);
            startTransition(() => {
              deleteAction(fd);
            });
          }}
        />
      </CardContent>
    </Card>
  );
}

export function AdminServiceCategoryForm({
  category,
  mode,
  vehicleClasses,
  showClassManager = true,
}: {
  category?: AdminCatalogCategory | null;
  mode: "create" | "edit";
  vehicleClasses: VehicleClassDef[];
  showClassManager?: boolean;
}) {
  const router = useRouter();
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const pricingClasses = useMemo(
    () =>
      vehicleClasses
        .filter((row) => row.is_active)
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)),
    [vehicleClasses],
  );
  const [subs, setSubs] = useState<DraftSub[]>(() => toDraftSubs(category));
  const [state, formAction, pending] = useActionState(
    saveAdminServiceCategoryAction,
    {},
  );

  useEffect(() => {
    if (!state.success || !state.id) return;
    if (mode === "create") {
      router.push(`/admin/services/${encodeURIComponent(state.id)}?saved=1`);
    }
    router.refresh();
  }, [mode, router, state.id, state.success]);

  const actionOptions = useMemo(
    () =>
      ACTION_VALUES.map((value) => ({
        value,
        label: actionLabel(value, p.actionOptions),
        icon: value.startsWith("link|")
          ? "arrow-down"
          : value.includes("emergency")
            ? "alert-triangle"
            : value.includes("mobile")
              ? "truck"
              : "wrench",
      })),
    [p.actionOptions],
  );

  function addSub() {
    const id = `new_${crypto.randomUUID()}`;
    setSubs((current) => [
      ...current,
      {
        key: id,
        id,
        label_ar: "",
        label_en: "",
        description_ar: "",
        description_en: "",
        action: "full|periodic_maintenance|workshop_visit",
        price: "120",
        classIds: [],
        pricesByClass: emptyClassPrices(),
        is_active: true,
      },
    ]);
  }

  function attachClassToSub(subKey: string, classId: string) {
    if (!classId) return;
    setSubs((current) =>
      current.map((sub) => {
        if (sub.key !== subKey) return sub;
        if (sub.classIds.includes(classId)) return sub;
        return {
          ...sub,
          classIds: [...sub.classIds, classId],
          pricesByClass: { ...sub.pricesByClass, [classId]: "" },
        };
      }),
    );
  }

  function detachClassFromSub(subKey: string, classId: string) {
    setSubs((current) =>
      current.map((sub) => {
        if (sub.key !== subKey) return sub;
        const nextPrices = { ...sub.pricesByClass };
        delete nextPrices[classId];
        return {
          ...sub,
          classIds: sub.classIds.filter((id) => id !== classId),
          pricesByClass: nextPrices,
        };
      }),
    );
  }

  function classLabel(classId: string): string {
    const row = vehicleClasses.find((item) => item.id === classId);
    if (!row) return classId;
    return locale === "en" ? row.nameEn || row.nameAr : row.nameAr;
  }

  return (
    <div className="space-y-6">
      {showClassManager ? (
        <VehicleClassesQuickManager classes={vehicleClasses} />
      ) : null}

      <form action={formAction} className="relative space-y-6">
      {pending ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          {t.common.saving}
        </div>
      ) : null}
      {mode === "edit" && category ? (
        <input type="hidden" name="id" value={category.id} />
      ) : null}

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm text-muted">{p.seedHint}</p>
            <p className="mt-1 text-xs font-medium text-primary">
              {p.parentTitleOnly}
            </p>
          </div>
          <div>
            <Label>{p.nameAr}</Label>
            <Input
              name="title_ar"
              required
              defaultValue={category?.title_ar ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{p.nameEn}</Label>
            <Input
              name="title_en"
              defaultValue={category?.title_en ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{p.descriptionAr}</Label>
            <Textarea
              name="description_ar"
              defaultValue={category?.description_ar ?? ""}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label>{p.descriptionEn}</Label>
            <Textarea
              name="description_en"
              defaultValue={category?.description_en ?? ""}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label>{p.sortOrder}</Label>
            <Input
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
              className="mt-1"
              dir="ltr"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={category?.is_active ?? true}
              />
              {p.active}
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{p.subServicesTitle}</h2>
              <p className="mt-1 text-sm text-muted">{p.subServicesHint}</p>
            </div>
            <Button type="button" variant="outline" onClick={addSub}>
              <Plus className="size-4" aria-hidden />
              {p.addSubService}
            </Button>
          </div>

          <div className="space-y-4">
            {subs.map((sub, index) => (
              <div
                key={sub.key}
                className={cn(
                  "rounded-[16px] border border-[var(--border)] bg-[var(--muted)]/20 p-4",
                )}
              >
                <input type="hidden" name="sub_id" value={sub.id} />
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    #{index + 1}
                  </p>
                  {subs.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() =>
                        setSubs((current) =>
                          current.filter((item) => item.key !== sub.key),
                        )
                      }
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {p.removeSub}
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>{p.subLabelAr}</Label>
                    <Input
                      name={`sub_label_ar_${sub.id}`}
                      required
                      defaultValue={sub.label_ar}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{p.subLabelEn}</Label>
                    <Input
                      name={`sub_label_en_${sub.id}`}
                      defaultValue={sub.label_en}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{p.subDescriptionAr}</Label>
                    <Textarea
                      name={`sub_description_ar_${sub.id}`}
                      defaultValue={sub.description_ar}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>{p.subDescriptionEn}</Label>
                    <Textarea
                      name={`sub_description_en_${sub.id}`}
                      defaultValue={sub.description_en}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>{p.subAction}</Label>
                    <div className="relative z-10 mt-1.5">
                      <IconSelect
                        name={`sub_action_${sub.id}`}
                        defaultValue={sub.action}
                        options={actionOptions}
                        fallbackIcon="layers"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{p.defaultPriceSar}</Label>
                    <Input
                      name={`sub_price_${sub.id}`}
                      type="number"
                      min={0}
                      step="1"
                      required
                      defaultValue={sub.price}
                      className="mt-1"
                      dir="ltr"
                    />
                    <p className="mt-1 text-xs text-muted">{p.defaultPriceHint}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>{p.pricesByClassTitle}</Label>
                    <p className="mt-1 text-xs text-muted">
                      {p.pricesByClassPerSubHint}
                    </p>
                    <input
                      type="hidden"
                      name={`sub_class_ids_${sub.id}`}
                      value={sub.classIds.join(",")}
                    />
                    {sub.classIds.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        {p.noClassesOnSub}
                      </p>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {sub.classIds.map((classId) => (
                          <div
                            key={classId}
                            className="rounded-xl border border-border p-3"
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <Label
                                htmlFor={`sub_price_${sub.id}_${classId}`}
                                className="text-xs text-muted"
                              >
                                {classLabel(classId)}
                              </Label>
                              <button
                                type="button"
                                className="rounded-md p-1 text-red-400 hover:bg-red-950/30"
                                aria-label={`${p.removeClassFromSub} ${classLabel(classId)}`}
                                onClick={() =>
                                  detachClassFromSub(sub.key, classId)
                                }
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </button>
                            </div>
                            <Input
                              id={`sub_price_${sub.id}_${classId}`}
                              name={`sub_price_${sub.id}_${classId}`}
                              type="number"
                              min={0}
                              step="1"
                              defaultValue={
                                sub.pricesByClass[classId] ?? ""
                              }
                              placeholder={sub.price}
                              className="mt-0"
                              dir="ltr"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {pricingClasses.some(
                      (row) => !sub.classIds.includes(row.id),
                    ) ? (
                      <div className="mt-3 max-w-md">
                        <Label
                          htmlFor={`attach_class_${sub.key}`}
                          className="text-xs text-muted"
                        >
                          {p.attachClassToSub}
                        </Label>
                        <div className="relative z-20 mt-1.5">
                          <IconSelect
                            key={`attach-${sub.key}-${sub.classIds.join("-")}`}
                            id={`attach_class_${sub.key}`}
                            options={[
                              {
                                value: "",
                                label: p.attachClassPlaceholder,
                                icon: "car",
                              },
                              ...pricingClasses
                                .filter((row) => !sub.classIds.includes(row.id))
                                .map((row) => ({
                                  value: row.id,
                                  label:
                                    locale === "en"
                                      ? row.nameEn || row.nameAr
                                      : row.nameAr,
                                  icon: "car" as const,
                                })),
                            ]}
                            defaultValue=""
                            fallbackIcon="car"
                            onValueChange={(value) => {
                              if (!value) return;
                              attachClassToSub(sub.key, value);
                            }}
                          />
                        </div>
                      </div>
                    ) : pricingClasses.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">
                        {p.noVehicleClasses}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-end md:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={`sub_active_${sub.id}`}
                        defaultChecked={sub.is_active}
                      />
                      {p.subActive}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {state.error ? (
        <div
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {mode === "edit" && state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.saveSuccess}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <PendingSubmitButton pending={pending} pendingLabel={t.common.saving}>
          {mode === "create" ? p.addService : p.editService}
        </PendingSubmitButton>
        <Link
          href="/admin/services"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-card-elevated"
        >
          {p.backToList}
        </Link>
      </div>
    </form>
    </div>
  );
}

export function AdminServiceAddForm({
  vehicleClasses,
}: {
  vehicleClasses: VehicleClassDef[];
}) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <VehicleClassesQuickManager classes={vehicleClasses} />
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">{p.addService}</h2>
            <Button
              type="button"
              variant={open ? "outline" : "default"}
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              {open ? (
                <>
                  <ChevronDown className="size-4 rotate-180" aria-hidden />
                  {p.hideAddForm}
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  {p.showAddForm}
                </>
              )}
            </Button>
          </div>
          {open ? (
            <div className="mt-4">
              <AdminServiceCategoryForm
                mode="create"
                vehicleClasses={vehicleClasses}
                showClassManager={false}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
