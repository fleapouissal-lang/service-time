"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme/theme-context";
import {
  loginFormSideClass,
  loginPanelClass,
  loginPanelOverlayClass,
} from "@/lib/login-styles";

export function LoginFormFallback() {
  const { theme } = useTheme();
  const heroImage = theme === "light" ? "/hero-bg-light.png" : "/hero-bg.png";

  return (
    <section
      className="grid w-full grid-cols-1 max-lg:min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] lg:min-h-screen lg:h-screen lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading login"
    >
      <div className={loginPanelClass}>
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div className={loginPanelOverlayClass} aria-hidden />
      </div>
      <div className={`${loginFormSideClass} items-center justify-center px-6 py-12`}>
        <div
          className="size-10 animate-spin rounded-full border-2 border-[#94D4B9]/30 border-t-[#94D4B9]"
          role="status"
          aria-hidden
        />
      </div>
    </section>
  );
}
