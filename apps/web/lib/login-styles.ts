import { cn } from "@/lib/utils";

export const loginPanelClass =
  "login-panel relative hidden overflow-hidden lg:flex lg:flex-col";

export const loginPanelOverlayClass =
  "login-panel__overlay pointer-events-none absolute inset-0";

export const loginPanelEyebrowClass = "login-eyebrow text-sm font-semibold";

export const loginPanelTitleClass =
  "login-panel__title mt-3 max-w-lg font-poppins text-4xl font-bold leading-tight xl:text-[2.75rem]";

export const loginPanelHighlightClass = "login-panel__highlight";

export const loginPanelDescClass =
  "login-panel__desc mt-5 max-w-md text-base leading-8";

export const loginFormSideClass =
  "login-form-side relative flex min-h-full flex-col items-center justify-center px-6 py-8 max-lg:py-4 sm:px-10 lg:min-h-screen lg:px-12 lg:py-12";

export const loginFormSideGlowClass =
  "login-form-side__glow pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-60";

export const loginCardClass = "login-card rounded-[20px] p-8 sm:p-10";

export const loginEyebrowClass = "login-eyebrow text-sm font-semibold";

export const loginTitleClass =
  "login-title mt-2 font-poppins text-2xl font-bold sm:text-3xl";

export const loginDescClass = "login-desc mt-2 text-sm leading-7";

export const loginLabelClass = "login-label";

export const loginInputClass = cn(
  "login-input mt-2 h-12 rounded-[20px] border border-[var(--login-input-border)] bg-[var(--login-input-bg)] text-[var(--login-input-text)] placeholder:text-[var(--login-input-placeholder)] focus-visible:ring-[var(--login-input-ring)]",
);

export const loginInputReadonlyClass = cn(loginInputClass, "bg-[var(--login-input-readonly-bg)]");

export const loginInputIconBtnClass =
  "login-input-icon-btn absolute inset-y-0 right-3 inline-flex items-center transition-colors";

export const loginBtnFilledClass =
  "login-btn-filled inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const loginBtnOutlineClass =
  "login-btn-outline inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] border text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5";

export const loginLinkClass = "login-link font-medium transition-opacity hover:opacity-80";

export const loginRegisterLinkClass = cn(
  loginLinkClass,
  "login-register-link hover:underline",
);

export const loginTextLinkClass = "login-link hover:underline";

export const loginMutedClass = "login-muted text-center text-sm";

export const loginHintClass = "login-hint mt-1 text-xs";

export const loginBackBtnClass =
  "login-back-btn mb-4 inline-flex items-center gap-1 text-sm transition-colors";

export const loginInfoBannerClass =
  "login-info-banner rounded-xl border px-4 py-3 text-sm";

export const loginErrorBannerClass =
  "login-error-banner rounded-xl border px-4 py-3 text-sm";

export const loginFooterClass =
  "login-footer mt-8 hidden space-y-2 text-center text-xs leading-6 lg:block";
