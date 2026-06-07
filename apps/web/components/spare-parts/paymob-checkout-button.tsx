"use client";

import { useState, useTransition } from "react";
import { startPaymobCheckoutAction } from "@/app/spare-parts/actions";
import { Button } from "@/components/ui/button";

export function PaymobCheckoutButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startPaymobCheckoutAction(orderId);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
      >
        {pending ? "جاري التحويل..." : "الدفع الآن — Accept"}
      </Button>
    </div>
  );
}
