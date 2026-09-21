import type { AccidentSupportMode } from "@/lib/tow-destinations";
import {
  isAccidentSupportSub,
  isFlatbedCatalogCategory,
} from "@/lib/tow-destinations";

/**
 * UI-only pricing presentation modes.
 * Does not change quote/payment rules — mirrors existing form flags.
 */
export type ServicePricingMode =
  | "ops_quote"
  | "fixed"
  | "editable"
  | "branch_no_price";

export function resolveServicePricingMode(input: {
  isTowFlow: boolean;
  accidentMode: AccidentSupportMode | "";
  isAccidentSupport: boolean;
  isMobileWorkshop: boolean;
  isWorkshopVisit: boolean;
}): ServicePricingMode {
  if (input.isTowFlow || input.accidentMode === "mobile") {
    return "ops_quote";
  }
  if (input.isAccidentSupport && input.accidentMode === "workshop") {
    return "branch_no_price";
  }
  if (input.isMobileWorkshop) {
    return "editable";
  }
  if (input.isWorkshopVisit) {
    return "fixed";
  }
  return "fixed";
}

/** Catalog list hint — same detectors already used by the request form. */
export function resolveCatalogSubPricingMode(input: {
  categoryId: string;
  categoryTitle?: string;
  subId: string;
  subLabel?: string;
}): ServicePricingMode {
  if (
    isFlatbedCatalogCategory(input.categoryId, {
      categoryTitle: input.categoryTitle,
      subId: input.subId,
      subLabel: input.subLabel,
    })
  ) {
    return "ops_quote";
  }
  if (isAccidentSupportSub(input.subId)) {
    return "ops_quote";
  }
  return "fixed";
}
