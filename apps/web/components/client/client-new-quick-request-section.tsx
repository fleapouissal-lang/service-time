"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { QuickRequestForm } from "@/components/request/quick-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientNewQuickRequestSectionProps = {
  defaultName: string;
  defaultPhone: string;
  defaultEmail?: string;
};

export function ClientNewQuickRequestSection({
  defaultName,
  defaultPhone,
  defaultEmail = "",
}: ClientNewQuickRequestSectionProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.client.quickRequestsPage;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleRequestCreated() {
    setOpen(false);
    setFormKey((value) => value + 1);
  }

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
          <QuickRequestForm
            key={formKey}
            bare
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            defaultEmail={defaultEmail}
            onSuccess={handleRequestCreated}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
