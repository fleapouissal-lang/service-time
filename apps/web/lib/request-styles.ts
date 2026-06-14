import { cn } from "@/lib/utils";
import {
  surfaceCardClass,
  surfaceCardInteractiveClass,
} from "@/lib/card-surface";

export const requestCardClass = cn(
  "request-card rounded-[20px] text-start",
  surfaceCardClass,
);

export const requestCardInteractiveClass = cn(
  "request-card rounded-[20px] text-start",
  surfaceCardInteractiveClass,
);

export const requestCardBadgeClass = "request-card__badge";

export const requestCardTitleClass = "request-card__title font-bold";

export const requestCardDescClass = "request-card__desc";

export const requestCardBtnClass =
  "request-card__btn inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[20px] font-semibold transition-opacity hover:opacity-90";

export const requestTabClass = "request-tab inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors";

export const requestTabActiveClass = "request-tab request-tab--active";

export const requestBtnFilledClass =
  "request-btn-filled inline-flex items-center justify-center rounded-[20px] font-semibold transition-opacity hover:opacity-90";

export const requestBtnOutlineClass =
  "request-btn-outline inline-flex items-center justify-center rounded-[20px] font-semibold transition-colors";

export const requestFieldShellClass = "request-field-shell";

export const requestAccentTextClass = "request-accent-text";

export const requestStepDotClass = "request-step-dot flex size-7 shrink-0 items-center justify-center rounded-full font-semibold";

export const requestStepLabelClass = "request-step-label";

export const requestSuccessBannerClass = "request-success-banner";

export const requestDividerLineClass = "request-divider-line";

export const requestDividerLabelClass = "request-divider-label";

export const requestAccentPanelClass = "request-accent-panel";

export const requestAccentPanelHighlightClass = "request-accent-panel request-accent-panel--highlight";

export const requestMapFrameClass = "request-map-frame overflow-hidden rounded-2xl";

export const requestMapCaptionClass = "request-map-caption";

export const requestSelectDropdownClass = "request-select-dropdown";

export const requestSelectOptionClass = "request-select-option";

export const requestSelectOptionActiveClass = "request-select-option request-select-option--active";

export const requestChoiceCardClass = "request-choice-card rounded-xl p-4 text-start";

export const requestChoiceCardActiveClass = "request-choice-card request-choice-card--active";
