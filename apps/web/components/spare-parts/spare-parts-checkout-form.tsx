"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  submitSparePartOrderAction,
  type SparePartOrderFormState,
} from "@/app/spare-parts/actions";
import { PageHeader } from "@/components/layout/page-header";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { useRequireClientForCart } from "@/lib/use-require-client-for-cart";

export function SparePartsCheckoutForm() {
  const router = useRouter();
  const { requireClient } = useRequireClientForCart();
  const { items, totalCount, totalAmount } = useSparePartsCart();
  const [ready, setReady] = useState(false);
  const [state, formAction, pending] = useActionState<
    SparePartOrderFormState,
    FormData
  >(submitSparePartOrderAction, {});

  useEffect(() => {
    void (async () => {
      const ok = await requireClient();
      if (!ok) return;
      setReady(true);
    })();
  }, [requireClient]);

  useEffect(() => {
    if (ready && items.length === 0) {
      router.replace("/spare-parts");
    }
  }, [ready, items.length, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-muted">
        جاري التحقق...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow="قطع الغيار"
        title="إتمام الطلب"
        description={`${totalCount} منتج — ${formatSparePartPrice(totalAmount)}`}
      />

      <section className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <form
          action={formAction}
          className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <input type="hidden" name="items" value={JSON.stringify(items)} />

          {state.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                  {item.img ? (
                    <Image
                      src={item.img}
                      alt={item.name_ar}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name_ar}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <SparePartPrice price={item.price} size="sm" />
                    <span>× {item.quantity}</span>
                  </div>
                </div>
                <span className="shrink-0 font-semibold" dir="ltr">
                  {formatSparePartPrice(getLineTotal(item.price, item.quantity))}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
            <span className="font-medium">المجموع</span>
            <SparePartPrice price={totalAmount} size="lg" className="text-primary" />
          </div>

          <div>
            <Label>طريقة الدفع</Label>
            <div className="mt-3 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="payment_method"
                  value="cash_on_delivery"
                  defaultChecked
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">الدفع عند الاستلام</span>
                  <span className="text-sm text-muted">
                    ادفع نقداً عند استلام القطع
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">الدفع الإلكتروني</span>
                  <span className="text-sm text-muted">
                    Accept — مدى، Visa، Mastercard، Apple Pay
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              name="notes"
              className="mt-2"
              placeholder="تفاصيل إضافية للطلب..."
            />
          </div>

          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending ? "جاري الإرسال..." : "تأكيد الطلب"}
          </Button>

          <Link
            href="/spare-parts"
            className="block text-center text-sm text-primary hover:underline"
          >
            ← العودة للقطع
          </Link>
        </form>
      </section>
    </>
  );
}
