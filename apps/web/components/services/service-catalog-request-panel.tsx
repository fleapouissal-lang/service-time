"use client";

import type { ClientVehicle } from "@service-time/types";
import { Suspense } from "react";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { useLocale } from "@/lib/i18n/locale-context";
import { parseCatalogAction } from "@/lib/services-catalog";

type ServiceCatalogRequestPanelProps = {
  categoryId: string;
  initialSubId?: string;
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  savedVehicles: ClientVehicle[];
  onSuccess?: () => void;
};

export function ServiceCatalogRequestPanel({
  categoryId,
  initialSubId = "",
  isClient,
  defaultName,
  defaultPhone,
  savedVehicles,
  onSuccess,
}: ServiceCatalogRequestPanelProps) {
  const { messages: t } = useLocale();
  const category = t.services.catalog.categories.find(
    (item) => item.id === categoryId,
  );
  const initialSub = category?.subOptions.find(
    (item) => item.id === initialSubId,
  );
  const parsedInitial =
    initialSub && parseCatalogAction(initialSub.action).kind === "full"
      ? parseCatalogAction(initialSub.action)
      : null;
  const fullDefaults =
    parsedInitial?.kind === "full" ? parsedInitial : null;

  return (
    <Suspense fallback={null}>
      <ServiceRequestForm
        embedded
        bare
        mobileSteps
        hidePriceNegotiationHint
        lockCatalogCategory
        loginRequired={!isClient}
        defaultName={defaultName}
        defaultPhone={defaultPhone}
        savedVehicles={savedVehicles}
        catalogDefaults={
          fullDefaults
            ? {
                categoryId,
                subId: initialSubId,
                serviceType: fullDefaults.serviceType,
                executionMethod: fullDefaults.executionMethod,
              }
            : {
                categoryId,
                subId: initialSubId,
                serviceType: "periodic_maintenance",
                executionMethod: "mobile_workshop",
              }
        }
        onSuccess={onSuccess}
      />
    </Suspense>
  );
}
