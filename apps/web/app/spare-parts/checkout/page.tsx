import type { Metadata } from "next";
import { Suspense } from "react";
import { SparePartsCheckoutForm } from "@/components/spare-parts/spare-parts-checkout-form";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.sparePartsCheckout,
    description: t.meta.descriptions.spareParts,
    pathname: "/spare-parts/checkout",
    locale,
    noIndex: true,
  });
}

export default function SparePartsCheckoutPage() {
  return (
    <Suspense>
      <SparePartsCheckoutForm />
    </Suspense>
  );
}
