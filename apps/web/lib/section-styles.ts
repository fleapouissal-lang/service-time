import { cn } from "@/lib/utils";

export const sectionEyebrowClass =
  "text-sm font-semibold text-[var(--section-eyebrow)]";

export const sectionTitleH1Class =
  "mt-2 text-3xl font-bold text-[var(--section-title)] sm:text-4xl";

export const sectionTitleH2Class =
  "mt-2 text-3xl font-bold text-[var(--section-title)]";

export const sectionTitleH2MdClass =
  "mt-2 font-poppins text-2xl font-bold leading-tight text-[var(--section-title)] sm:text-3xl";

export const sectionTitleDashboardClass =
  "text-2xl font-bold text-[var(--section-title)]";

export const tagPillClass = cn(
  "rounded-[20px] bg-[var(--tag-bg)] font-semibold text-[var(--tag-fg)]",
);

export const tagPillSmClass = cn(
  tagPillClass,
  "px-2.5 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-xs",
);

export const serviceTagPillSmClass = cn(
  "rounded-[20px] bg-[var(--service-tag-bg)] font-semibold text-[var(--service-tag-fg)]",
  "px-2.5 py-0.5 text-[11px] sm:px-3 sm:py-1 sm:text-xs",
);
