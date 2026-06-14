import type { Metadata } from "next";
import { LegalPageContent } from "@/components/legal/legal-page-content";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.legalTerms,
    description: t.meta.descriptions.legalTerms,
    pathname: "/legal/terms",
    locale,
  });
}

export default async function LegalTermsPage() {
  const { t } = await getServerI18n();
  return <LegalPageContent page={t.legal.terms} />;
}
