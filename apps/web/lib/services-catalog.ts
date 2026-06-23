import type { ExecutionMethod, ServiceType } from "@service-time/types";
import type { IconSelectOption } from "@/lib/icon-select-options";

export type ParsedCatalogAction =
  | {
      kind: "full";
      serviceType: ServiceType;
      executionMethod: ExecutionMethod;
    }
  | { kind: "link"; href: string };

const FULL_ACTION_RE =
  /^full\|(periodic_maintenance|emergency|spare_parts)\|(workshop_visit|mobile_workshop)$/;

const LINK_ACTION_RE = /^link\|(.+)$/;

export function parseCatalogAction(raw: string): ParsedCatalogAction {
  const fullMatch = FULL_ACTION_RE.exec(raw);
  if (fullMatch) {
    return {
      kind: "full",
      serviceType: fullMatch[1] as ServiceType,
      executionMethod: fullMatch[2] as ExecutionMethod,
    };
  }

  const linkMatch = LINK_ACTION_RE.exec(raw);
  if (linkMatch) {
    return { kind: "link", href: linkMatch[1] };
  }

  return {
    kind: "full",
    serviceType: "periodic_maintenance",
    executionMethod: "mobile_workshop",
  };
}

export function buildServiceRequestHref(
  action: string,
  categoryId: string,
  subId: string,
): string {
  const parsed = parseCatalogAction(action);

  if (parsed.kind === "link") return parsed.href;

  const params = new URLSearchParams({
    type: parsed.serviceType,
    execution_method: parsed.executionMethod,
    category: categoryId,
    sub: subId,
  });
  return `/request?${params.toString()}`;
}

export function resolveCatalogPrefillDescription(
  categories: readonly {
    id: string;
    title: string;
    subOptions: readonly { id: string; label: string }[];
  }[],
  categoryId: string | null,
  subId: string | null,
): string {
  if (!categoryId || !subId) return "";
  const category = categories.find((item) => item.id === categoryId);
  const sub = category?.subOptions.find((item) => item.id === subId);
  if (!category || !sub) return "";
  return `${category.title} — ${sub.label}`;
}

export type CatalogCategoryLike = {
  id: string;
  title: string;
  subOptions: readonly {
    id: string;
    label: string;
    description: string;
    action: string;
  }[];
};

export function findCatalogSubOption(
  categories: readonly CatalogCategoryLike[],
  categoryId: string,
  subId: string,
) {
  const category = categories.find((item) => item.id === categoryId);
  return category?.subOptions.find((item) => item.id === subId) ?? null;
}

const CATALOG_CATEGORIES_WITHOUT_EXECUTION_METHOD = new Set([
  "spare_parts",
  "external_tracking",
]);

export function catalogCategoryShowsExecutionMethod(categoryId: string): boolean {
  if (!categoryId) return true;
  return !CATALOG_CATEGORIES_WITHOUT_EXECUTION_METHOD.has(categoryId);
}

export function defaultExecutionMethodForCategory(
  categoryId: string,
  parsed?: Extract<ParsedCatalogAction, { kind: "full" }>,
): ExecutionMethod {
  if (parsed?.kind === "full") return parsed.executionMethod;
  if (categoryId === "spare_parts") return "workshop_visit";
  if (categoryId === "mobile_maintenance") return "mobile_workshop";
  return "mobile_workshop";
}

export function buildCatalogCategorySelectOptions(
  categories: readonly { id: string; title: string }[],
  placeholder: string,
): IconSelectOption[] {
  return [
    { value: "", label: placeholder, icon: "layers" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.title,
      icon: "wrench",
    })),
  ];
}

export function buildCatalogSubSelectOptions(
  categories: readonly CatalogCategoryLike[],
  categoryId: string,
  placeholder: string,
): IconSelectOption[] {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) {
    return [{ value: "", label: placeholder, icon: "layers" }];
  }

  return [
    { value: "", label: placeholder, icon: "layers" },
    ...category.subOptions.map((sub) => ({
      value: sub.id,
      label: sub.label,
      icon: "circle",
    })),
  ];
}
