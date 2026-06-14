"use client";

import Link from "next/link";
import { Suspense } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { QuickRequestForm } from "@/components/request/quick-request-form";
import {
  RequestModeHub,
  RequestModeTabs,
  type RequestMode,
} from "@/components/request/request-mode-hub";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { RequestSparePartsFab } from "@/components/request/request-spare-parts-fab";
import { WhatsAppQuickContact } from "@/components/request/whatsapp-quick-contact";
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
  mode: RequestMode;
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  loginNextPath: string;
  savedVehicles?: string[];
};

function FullRequestPanel({
  isClient,
  defaultName,
  defaultPhone,
  loginNextPath,
  savedVehicles = [],
}: {
  isClient: boolean;
  defaultName: string;
  defaultPhone: string;
  loginNextPath: string;
  savedVehicles?: string[];
}) {
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

function RequestBody({
  mode,
  isClient,
  defaultName,
  defaultPhone,
  loginNextPath,
  savedVehicles = [],
}: RequestPageContentProps) {
  if (mode === "hub") {
    return <RequestModeHub />;
  }

  if (mode === "full") {
    return (
      <FullRequestPanel
        isClient={isClient}
        defaultName={defaultName}
        defaultPhone={defaultPhone}
        loginNextPath={loginNextPath}
        savedVehicles={savedVehicles}
      />
    );
  }

  if (mode === "quick") {
    return <QuickRequestForm />;
  }

  return (
    <>
      <div className="hidden md:block">
        <WhatsAppQuickContact />
      </div>
      <div className="md:hidden">
        <RequestModeHub />
      </div>
    </>
  );
}

function RequestHeader({ mode }: { mode: RequestMode }) {
  const { messages: t } = useLocale();

  const copy = {
    hub: {
      title: t.request.hubTitle,
      description: t.request.hubDescription,
    },
    full: {
      title: t.request.title,
      description: t.request.modes.fullDescription,
    },
    quick: {
      title: t.request.modes.quickTitle,
      description: t.request.modes.quickDescription,
    },
    whatsapp: {
      title: t.request.modes.whatsappTitle,
      description: t.request.modes.whatsappDescription,
    },
  }[mode];

  return (
    <div
      className={cn(
        (mode === "hub" || mode === "full" || mode === "whatsapp") &&
          "hidden md:block",
      )}
    >
      <PageHeader
        plain
        plainWidth="md"
        eyebrow={t.request.eyebrow}
        title={copy.title}
        description={copy.description}
      />
    </div>
  );
}

export function RequestPageContent(props: RequestPageContentProps) {
  const { mode } = props;
  const centerOnMobile = mode !== "hub" && mode !== "whatsapp";
  const showTabsOnMobile = mode !== "hub" && mode !== "whatsapp";

  return (
    <>
      <RequestHeader mode={mode} />
      <RequestSparePartsFab />
      <div
        className={cn(
          centerOnMobile && cn(MOBILE_SCREEN_CENTER, "max-md:px-3"),
        )}
      >
        {mode !== "hub" ? (
          <div
            className={cn(
              "mb-10 max-md:mx-auto max-md:w-full max-md:max-w-3xl max-md:shrink-0",
              mode === "full" && "max-md:mb-4",
              !showTabsOnMobile && "max-md:hidden",
            )}
          >
            <Suspense fallback={null}>
              <RequestModeTabs active={mode} />
            </Suspense>
          </div>
        ) : null}
        {mode === "hub" ? (
          <Suspense fallback={null}>
            <RequestBody {...props} />
          </Suspense>
        ) : (
          <RequestBody {...props} />
        )}
      </div>
    </>
  );
}
