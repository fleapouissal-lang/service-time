import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageContent } from "@/components/legal/legal-page-content";
import { getPublicLegalPageBySlug } from "@/lib/legal-pages-admin";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";

type LegalSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: LegalSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getServerI18n();
  const result = await getPublicLegalPageBySlug(slug, locale);
  if (!result) {
    return buildPageMetadata({
      title: "Legal",
      description: "",
      pathname: `/legal/${slug}`,
      locale,
    });
  }

  return buildPageMetadata({
    title: result.copy.title,
    description: result.copy.intro.slice(0, 160),
    pathname: `/legal/${result.page.slug}`,
    locale,
  });
}

export default async function LegalSlugPage({ params }: LegalSlugPageProps) {
  const { slug } = await params;
  const { locale } = await getServerI18n();
  const result = await getPublicLegalPageBySlug(slug, locale);
  if (!result) notFound();
  return <LegalPageContent page={result.copy} />;
}
