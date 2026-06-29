import type { Metadata } from "next";
import { NotFoundPage } from "@/components/errors/not-found-page";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.notFound,
    description: t.notFound.description,
    pathname: "/404",
    locale,
    noIndex: true,
  });
}

export default async function NotFound() {
  const { t } = await getServerI18n();

  return (
    <NotFoundPage
      copy={{
        eyebrow: t.notFound.eyebrow,
        title: t.notFound.title,
        description: t.notFound.description,
        backHome: t.notFound.backHome,
        requestService: t.notFound.requestService,
        browseServices: t.notFound.browseServices,
        contactUs: t.notFound.contactUs,
        quickLinksAria: t.notFound.quickLinksAria,
      }}
    />
  );
}
