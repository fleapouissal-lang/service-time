"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientNewOrderSectionProps = {
  defaultName: string;
  defaultPhone: string;
  savedVehicles?: string[];
};

export function ClientNewOrderSection({
  defaultName,
  defaultPhone,
  savedVehicles = [],
}: ClientNewOrderSectionProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.client.ordersPage;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleOrderCreated() {
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
          <ServiceRequestForm
            key={formKey}
            embedded
            bare
            refreshDashboard
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            savedVehicles={savedVehicles}
            onSuccess={handleOrderCreated}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
