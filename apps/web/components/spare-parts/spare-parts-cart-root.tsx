"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SparePartsCartProvider,
  useSparePartsCart,
} from "@/components/spare-parts/spare-parts-cart-context";

const SparePartsCartDrawer = dynamic(
  () =>
    import("@/components/spare-parts/spare-parts-cart-drawer").then(
      (mod) => mod.SparePartsCartDrawer,
    ),
  { ssr: false, loading: () => null },
);

function GlobalCartDrawer() {
  const { drawerOpen, closeCartDrawer } = useSparePartsCart();
  if (!drawerOpen) return null;

  return (
    <SparePartsCartDrawer open={drawerOpen} onClose={closeCartDrawer} />
  );
}

function CartAutoOpen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openCartDrawer } = useSparePartsCart();
  const cartParam = searchParams.get("cart");

  useEffect(() => {
    if (cartParam !== "1") return;

    openCartDrawer();

    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cart");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [cartParam, pathname, router, openCartDrawer, searchParams]);

  return null;
}

export function SparePartsCartRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SparePartsCartProvider>
      {children}
      <GlobalCartDrawer />
      <Suspense fallback={null}>
        <CartAutoOpen />
      </Suspense>
    </SparePartsCartProvider>
  );
}
