import { cn } from "@/lib/utils";

export const surfaceCardClass = cn(
  "rounded-[20px] border border-[var(--card-border)] bg-card text-card-foreground shadow-[var(--card-shadow)]",
);

export const surfaceCardInteractiveClass = cn(
  surfaceCardClass,
  "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[var(--card-border)] hover:shadow-[var(--card-hover-shadow)]",
);

export const iconAccentClass = "text-[var(--icon-accent)]";

export const iconAccentMutedClass = "text-[var(--icon-accent-muted)]";

export const iconAccentBgClass = "bg-[var(--icon-accent-bg)]";

export const surfaceCardIconWrapClass = cn(
  "flex shrink-0 items-center justify-center rounded-xl",
  iconAccentBgClass,
);

export const surfaceCardIconClass = iconAccentClass;
