"use client";

import type { ClientVehicle } from "@service-time/types";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { RequestSparePartsFab } from "@/components/request/request-spare-parts-fab";
import { PageHeader } from "@/components/layout/page-header";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  requestBtnFilledClass,
  requestBtnOutlineClass,
  requestCardClass,
} from "@/lib/request-styles";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { MOBILE_SCREEN_CENTER } from "@/lib/mobile-nav-layout";
import { cn } from "@/lib/utils";

type RequestPageContentProps = {
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  loginNextPath: string;
  savedVehicles?: ClientVehicle[];
};

function FullRequestPanel({
  isClient,
  defaultName,
  defaultPhone,
  loginNextPath,
  savedVehicles = [],
}: RequestPageContentProps) {
  const { messages: t } = useLocale();
  const loginHref = `/login?next=${encodeURIComponent(loginNextPath)}`;

  if (!isClient) {
    return (
      <section
        className={cn(
          "mx-auto w-[90%] max-w-lg pb-16 max-md:w-full max-md:max-w-[480px] max-md:pb-4",
          MOBILE_SCREEN_CENTER,
        )}
      >
        <div className={cn(requestCardClass, "space-y-6 p-8 text-start")}>
          <div className={cn("flex size-16 items-center justify-center rounded-2xl", iconAccentBgClass)}>
            <LogIn className={cn("size-8", iconAccentClass)} aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="request-card__title text-xl font-bold">{t.request.loginGate.title}</h2>
            <p className="request-card__desc text-sm leading-7">{t.request.modes.fullLoginHint}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <Link
              href={loginHref}
              className={cn(requestBtnFilledClass, "h-11 px-5 text-sm")}
            >
              {t.request.loginGate.login}
            </Link>
            <Link
              href="/register"
              className={cn(requestBtnOutlineClass, "h-11 gap-2 px-5 text-sm")}
            >
              <UserPlus className="size-4" aria-hidden />
              {t.request.loginGate.register}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ServiceRequestForm
      embedded
      mobileSteps
      hidePriceNegotiationHint
      defaultName={defaultName}
      defaultPhone={defaultPhone}
      savedVehicles={savedVehicles}
    />
  );
}

export function RequestPageContent(props: RequestPageContentProps) {
  const { messages: t } = useLocale();

  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          plain
          plainWidth="md"
          eyebrow={t.request.eyebrow}
          title={t.request.title}
          description={t.request.modes.fullDescription}
        />
      </div>
      <RequestSparePartsFab />
      <div className={cn(MOBILE_SCREEN_CENTER, "max-md:px-3")}>
        <FullRequestPanel {...props} />
      </div>
    </>
  );
}
