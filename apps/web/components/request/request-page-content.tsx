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
import { WhatsAppQuickContact } from "@/components/request/whatsapp-quick-contact";
import { PageHeader } from "@/components/layout/page-header";
import { useLocale } from "@/lib/i18n/locale-context";

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
      <section className="mx-auto w-[90%] max-w-lg pb-16">
        <div className="space-y-6 rounded-[20px] border border-[#94D4B9]/20 bg-[#091014] p-8 text-center shadow-[0_4px_24px_rgba(148,212,185,0.06)]">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#94D4B9]/10">
            <LogIn className="size-8 text-[#94D4B9]" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t.request.loginGate.title}</h2>
            <p className="text-sm leading-7 text-muted">{t.request.modes.fullLoginHint}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={loginHref}
              className="inline-flex h-11 items-center justify-center rounded-[20px] bg-[#94D4B9] px-5 text-sm font-semibold text-[#050B10] hover:opacity-90"
            >
              {t.request.loginGate.login}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/20 px-5 text-sm font-semibold hover:bg-[#94D4B9]/5"
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
      fullWidth
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

  return <WhatsAppQuickContact />;
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
    <PageHeader
      plain
      plainWidth="md"
      eyebrow={t.request.eyebrow}
      title={copy.title}
      description={copy.description}
    />
  );
}

export function RequestPageContent(props: RequestPageContentProps) {
  const { mode } = props;

  return (
    <>
      <RequestHeader mode={mode} />
      {mode !== "hub" ? (
        <div className="mb-10">
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
    </>
  );
}
