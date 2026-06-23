export const THEME_COOKIE = "st-theme";

export type Theme = "dark" | "light";

export const DEFAULT_THEME: Theme = "light";

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "dark" || value === "light";
}
