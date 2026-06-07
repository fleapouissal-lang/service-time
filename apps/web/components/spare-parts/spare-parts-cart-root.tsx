"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SparePartsCartDrawer } from "@/components/spare-parts/spare-parts-cart-drawer";
import { SparePartsCartProvider } from "@/components/spare-parts/spare-parts-cart-context";

function CartAutoOpen() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("cart") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

  return <SparePartsCartDrawer open={open} onClose={() => setOpen(false)} />;
}

export function SparePartsCartRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SparePartsCartProvider>
      {children}
      <Suspense fallback={null}>
        <CartAutoOpen />
      </Suspense>
    </SparePartsCartProvider>
  );
}
