"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientSetServicePaymentMethodAction } from "@/lib/service-payment-actions";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function SwitchServicePaymentMethodForm({
  requestId,
  paymentMethod,
  label,
  variant = "outline",
  className,
}: {
  requestId: string;
  paymentMethod: "online" | "cash_on_delivery";
  label: string;
  variant?: "outline" | "default" | "accent";
  className?: string;
}) {
  const { messages: t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await clientSetServicePaymentMethodAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <Button
        type="submit"
        variant={variant}
        className="h-11 w-full rounded-[20px]"
        disabled={pending}
      >
        {pending ? t.common.saving : label}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
