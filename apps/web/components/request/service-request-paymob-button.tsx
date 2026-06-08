"use client";

import { useState, useTransition } from "react";
import { startServiceRequestPaymobCheckoutAction } from "@/lib/service-payment-actions";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function ServiceRequestPaymobButton({ requestId }: { requestId: string }) {
  const { messages: t } = useLocale();
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
            const result = await startServiceRequestPaymobCheckoutAction(requestId);
            if (result?.error) {
              setError(result.error);
            }
          });
        }}
      >
        {pending ? t.request.payment.payRedirecting : t.request.payment.payNow}
      </Button>
    </div>
  );
}
