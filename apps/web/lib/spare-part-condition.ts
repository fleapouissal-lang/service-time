import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/messages/types";
import type { SparePartCondition } from "@service-time/types";

export function isSparePartCondition(
  value: string | null | undefined,
): value is SparePartCondition {
  return value === "new" || value === "used";
}

export function parseSparePartCondition(
  value: FormDataEntryValue | null | undefined,
): SparePartCondition {
  const raw = String(value ?? "new").trim();
  return isSparePartCondition(raw) ? raw : "new";
}

export function getSparePartConditionLabel(
  condition: SparePartCondition | null | undefined,
  t: Messages,
): string {
  const value = condition ?? "new";
  return value === "used" ? t.spareParts.condition.used : t.spareParts.condition.new;
}

export function getSparePartConditionFilterOptions(t: Messages) {
  return [
    { value: "new", label: t.spareParts.condition.new },
    { value: "used", label: t.spareParts.condition.used },
  ];
}

export function resolveSparePartCondition(
  part: { part_condition?: SparePartCondition | null },
): SparePartCondition {
  return part.part_condition ?? "new";
}

export function sparePartConditionAriaLabel(
  condition: SparePartCondition,
  locale: Locale,
  t: Messages,
): string {
  return getSparePartConditionLabel(condition, t);
}
