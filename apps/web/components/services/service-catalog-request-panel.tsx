"use client";

import type { ClientVehicle } from "@service-time/types";
import { Suspense } from "react";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  parseCatalogAction,
  type CatalogCategoryLike,
} from "@/lib/services-catalog";

type ServiceCatalogRequestPanelProps = {
  categoryId: string;
  initialSubId?: string;
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  savedVehicles: ClientVehicle[];
  categories?: CatalogCategoryLike[];
  onSuccess?: () => void;
};

export function ServiceCatalogRequestPanel({
  categoryId,
  initialSubId = "",
  isClient,
  defaultName,
  defaultPhone,
  savedVehicles,
  categories,
  onSuccess,
}: ServiceCatalogRequestPanelProps) {
  const { messages: t } = useLocale();
  const fallbackCategories = t.services.catalog.categories;
  const catalogCategories =
    categories && categories.length > 0
      ? categories
      : (fallbackCategories as unknown as CatalogCategoryLike[]);
  const category = catalogCategories.find((item) => item.id === categoryId);
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
        catalogCategories={catalogCategories}
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
