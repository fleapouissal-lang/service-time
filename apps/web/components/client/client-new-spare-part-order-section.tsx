"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

export function ClientNewSparePartOrderSection() {
  const { messages: t } = useLocale();
  const p = t.dashboard.client.sparePartOrdersPage;
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{p.createOrder}</h2>
            <p className="mt-1 text-sm text-muted">{p.createOrderHint}</p>
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
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/spare-parts"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t.spareParts.browseParts}
            </Link>
            <Link
              href="/spare-parts/checkout"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
            >
              {t.spareParts.orderSelected}
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
