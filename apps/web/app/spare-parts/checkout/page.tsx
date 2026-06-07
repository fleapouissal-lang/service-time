import type { Metadata } from "next";
import { Suspense } from "react";
import { SparePartsCheckoutForm } from "@/components/spare-parts/spare-parts-checkout-form";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.sparePartsCheckout };
}

export default function SparePartsCheckoutPage() {
  return (
    <Suspense>
      <SparePartsCheckoutForm />
    </Suspense>
  );
}
