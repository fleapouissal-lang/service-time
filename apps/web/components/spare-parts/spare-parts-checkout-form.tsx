"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  getSparePartsCheckoutPrefillAction,
  submitSparePartOrderAction,
  type SparePartOrderFormState,
} from "@/app/spare-parts/actions";
import { PageHeader } from "@/components/layout/page-header";
import { useSparePartsCart } from "@/components/spare-parts/spare-parts-cart-context";
import { SparePartPrice } from "@/components/spare-parts/spare-part-price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactValidationErrorMessage,
  validateRequiredContact,
} from "@/lib/contact-validation";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { useLocale } from "@/lib/i18n/locale-context";
import { getCartItemName } from "@/lib/localized-content";
import { useRequireClientForCart } from "@/lib/use-require-client-for-cart";
import { cn } from "@/lib/utils";

export function SparePartsCheckoutForm() {
  const { messages: t, locale } = useLocale();
  const c = t.checkout;
  const router = useRouter();
  const { requireClient } = useRequireClientForCart();
  const { items, totalCount, totalAmount } = useSparePartsCart();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [state, formAction, pending] = useActionState<
    SparePartOrderFormState,
    FormData
  >(submitSparePartOrderAction, {});

  useEffect(() => {
    void (async () => {
      const ok = await requireClient();
      if (!ok) return;

      const prefill = await getSparePartsCheckoutPrefillAction();
      if (prefill) {
        setFullName(prefill.fullName);
        setPhone(prefill.phone);
        setEmail(prefill.email);
      }

      setReady(true);
    })();
  }, [requireClient]);

  useEffect(() => {
    if (ready && items.length === 0) {
      router.replace("/spare-parts");
    }
  }, [ready, items.length, router]);

  function goToPaymentStep() {
    setStepError("");

    if (fullName.trim().length < 2) {
      setStepError(c.errors.nameRequired);
      return;
    }

    const contact = validateRequiredContact(email, phone);
    if (!contact.ok) {
      setStepError(
        contactValidationErrorMessage(contact.error, {
          emailRequired: t.errors.contact.emailRequired,
          invalidEmail: t.errors.contact.invalidEmail,
          phoneRequired: t.errors.contact.phoneRequired,
          invalidPhone: t.errors.contact.invalidPhone,
        }),
      );
      return;
    }

    if (deliveryAddress.trim().length < 5) {
      setStepError(c.errors.addressRequired);
      return;
    }

    setStep(2);
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-muted">
        {t.spareParts.verifying}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        plain
        plainWidth="md"
        eyebrow={c.eyebrow}
        title={c.title}
        description={`${totalCount} ${t.common.product} — ${formatSparePartPrice(totalAmount)}`}
      />

      <section className="mx-auto max-w-xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <StepPill active={step === 1} done={step > 1} label={c.step1Label} />
          <div className="h-px flex-1 bg-border" aria-hidden />
          <StepPill active={step === 2} done={false} label={c.step2Label} />
        </div>

        <form
          action={formAction}
          className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <input type="hidden" name="customer_full_name" value={fullName} />
          <input type="hidden" name="customer_phone" value={phone} />
          <input type="hidden" name="customer_email" value={email} />
          <input type="hidden" name="delivery_address" value={deliveryAddress} />

          {state.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
              {state.error}
            </div>
          ) : null}

          {stepError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
              {stepError}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{c.step1Title}</h2>
                <p className="mt-1 text-sm text-muted">{c.step1Hint}</p>
              </div>

              <div>
                <Label htmlFor="customer_full_name">{c.fullName}</Label>
                <Input
                  id="customer_full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  className="mt-2"
                  placeholder={t.common.placeholderName}
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">{c.phone}</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-2"
                  placeholder={t.common.placeholderPhoneLocal}
                />
              </div>

              <div>
                <Label htmlFor="customer_email">{c.email}</Label>
                <Input
                  id="customer_email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                  placeholder={t.common.placeholderEmail}
                />
              </div>

              <div>
                <Label htmlFor="delivery_address">{c.deliveryAddress}</Label>
                <Textarea
                  id="delivery_address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  minLength={5}
                  rows={3}
                  className="mt-2"
                  placeholder={c.deliveryAddressPlaceholder}
                />
                <p className="mt-1 text-xs text-muted">{c.deliveryAddressHint}</p>
              </div>

              <Button
                type="button"
                className="h-11 w-full"
                onClick={goToPaymentStep}
              >
                {c.nextStep}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{c.step2Title}</h2>
                  <p className="mt-1 text-sm text-muted">{c.step2Hint}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep(1);
                    setStepError("");
                  }}
                >
                  {c.backStep}
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-4 text-sm">
                <p className="font-medium">{fullName}</p>
                <p className="mt-1 text-muted" dir="ltr">
                  {phone}
                </p>
                <p className="text-muted" dir="ltr">
                  {email}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">
                  {deliveryAddress}
                </p>
              </div>

              <ul className="space-y-3">
                {items.map((item) => {
                  const itemName = getCartItemName(item, locale);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                        {item.img ? (
                          <Image
                            src={item.img}
                            alt={itemName}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{itemName}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                          <SparePartPrice price={item.price} size="sm" />
                          <span>× {item.quantity}</span>
                        </div>
                      </div>
                      <span className="shrink-0 font-semibold" dir="ltr">
                        {formatSparePartPrice(
                          getLineTotal(item.price, item.quantity),
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
                <span className="font-medium">{t.common.total}</span>
                <SparePartPrice
                  price={totalAmount}
                  size="lg"
                  className="text-primary"
                />
              </div>

              <div>
                <Label>{t.spareParts.paymentMethod}</Label>
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
                      <span className="block font-medium">
                        {t.spareParts.cashOnDelivery}
                      </span>
                      <span className="text-sm text-muted">
                        {t.spareParts.cashOnDeliveryHint}
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
                      <span className="block font-medium">
                        {t.spareParts.onlinePayment}
                      </span>
                      <span className="text-sm text-muted">
                        {t.spareParts.onlinePaymentHint}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t.spareParts.notesOptional}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  className="mt-2"
                  placeholder={t.common.placeholderNotes}
                />
              </div>

              <Button type="submit" className="h-11 w-full" disabled={pending}>
                {pending ? t.common.sending : t.spareParts.confirmOrder}
              </Button>
            </div>
          )}

          <Link
            href="/spare-parts"
            className="block text-center text-sm text-primary hover:underline"
          >
            {t.spareParts.backToParts}
          </Link>
        </form>
      </section>
    </>
  );
}

function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        done
          ? "bg-primary/15 text-primary"
          : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted/20 text-muted",
      )}
    >
      {label}
    </span>
  );
}
