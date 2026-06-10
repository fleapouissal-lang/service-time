"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import type { WorkshopBranch } from "@/lib/localized-content";
import { AdminWorkshopForm } from "@/components/admin/admin-workshop-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminWorkshopsManagerProps = {
  workshops: WorkshopBranch[];
};

export function AdminWorkshopsManager({ workshops }: AdminWorkshopsManagerProps) {
  const router = useRouter();
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.locationsPage;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const canDelete = workshops.length > 1;

  function refresh() {
    router.refresh();
  }

  function handleAdded() {
    refresh();
    setOpen(false);
    setFormKey((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{p.addWorkshop}</h2>
              <p className="mt-1 text-sm text-muted">{p.addWorkshopHint}</p>
            </div>
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
            <AdminWorkshopForm
              key={formKey}
              embedded
              onSaved={handleAdded}
              className="mt-4 border-0 bg-transparent p-0 shadow-none"
            />
          ) : null}
        </CardContent>
      </Card>

      {workshops.length > 0 ? (
        <div className="space-y-6">
          {workshops.map((branch) => (
            <AdminWorkshopForm
              key={branch.id}
              branch={branch}
              canDelete={canDelete}
              onSaved={refresh}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
