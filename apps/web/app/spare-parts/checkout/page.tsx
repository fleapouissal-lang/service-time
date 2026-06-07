import type { Metadata } from "next";
import { Suspense } from "react";
import { SparePartsCheckoutForm } from "@/components/spare-parts/spare-parts-checkout-form";

export const metadata: Metadata = {
  title: "إتمام طلب قطع الغيار",
};

export default function SparePartsCheckoutPage() {
  return (
    <Suspense>
      <SparePartsCheckoutForm />
    </Suspense>
  );
}
