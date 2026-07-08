"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  deleteAdminServiceCategoryAction,
  saveAdminServiceCategoryAction,
} from "@/app/admin/actions";
import type { AdminCatalogCategory } from "@/lib/services-catalog-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatSparePartPrice } from "@/lib/format-price";
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
  is_active: boolean;
};

function toDraftSubs(category?: AdminCatalogCategory | null): DraftSub[] {
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
        is_active: true,
      },
    ];
  }
  return category.subOptions.map((sub) => ({
    key: sub.id,
    id: sub.id,
    label_ar: sub.label_ar,
    label_en: sub.label_en,
    description_ar: sub.description_ar,
    description_en: sub.description_en,
    action: sub.action,
    price: String(sub.price),
    is_active: sub.is_active,
  }));
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

  if (categories.length === 0) {
    return <p className="p-6 text-center text-muted">{p.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
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
                    {category.subOptions.slice(0, 3).map((sub) => (
                      <p key={sub.id}>
                        {locale === "en" ? sub.label_en || sub.label_ar : sub.label_ar}
                        {" · "}
                        {formatSparePartPrice(sub.price, locale)}
                      </p>
                    ))}
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
                    <form action={deleteAdminServiceCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <Button
                        type="submit"
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
                      </Button>
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

export function AdminServiceCategoryForm({
  category,
  mode,
}: {
  category?: AdminCatalogCategory | null;
  mode: "create" | "edit";
}) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [subs, setSubs] = useState<DraftSub[]>(() => toDraftSubs(category));

  const actionOptions = useMemo(
    () =>
      ACTION_VALUES.map((value) => ({
        value,
        label: actionLabel(value, p.actionOptions),
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
        is_active: true,
      },
    ]);
  }

  return (
    <form action={saveAdminServiceCategoryAction} className="space-y-6">
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
                    <select
                      name={`sub_action_${sub.id}`}
                      defaultValue={sub.action}
                      className="mt-1 flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm"
                    >
                      {actionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>{p.priceSar}</Label>
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

      <div className="flex flex-wrap gap-3">
        <Button type="submit">
          {mode === "create" ? p.addService : p.editService}
        </Button>
        <Link
          href="/admin/services"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-card-elevated"
        >
          {p.backToList}
        </Link>
      </div>
    </form>
  );
}

export function AdminServiceAddForm() {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [open, setOpen] = useState(false);

  return (
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
            <AdminServiceCategoryForm mode="create" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
