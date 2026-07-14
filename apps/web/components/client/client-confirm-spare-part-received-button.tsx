"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { confirmSparePartOrderReceivedAction } from "@/app/spare-parts/actions";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  orderId: string;
};

export function ClientConfirmSparePartReceivedButton({ orderId }: Props) {
  const { messages: t } = useLocale();
  const p = t.dashboard.client.sparePartOrdersPage;
  const [state, action, pending] = useActionState(
    confirmSparePartOrderReceivedAction,
    {},
  );

  if (state.success) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
        role="status"
      >
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        {p.confirmReceivedSuccess}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="id" value={orderId} />
      <p className="text-sm text-muted">{p.confirmReceivedHint}</p>
      <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
        {pending ? t.common.saving : p.confirmReceived}
      </Button>
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
