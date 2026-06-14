"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { submitQuickServiceRequest } from "@/app/request/quick-actions";
import { RequestFormShell } from "@/components/request/request-form-shell";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { FormSecurityFields } from "@/components/forms/form-security-fields";
import {
  requestAccentTextClass,
  requestBtnFilledClass,
  requestSuccessBannerClass,
} from "@/lib/request-styles";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import {
  contactValidationErrorMessage,
  validateQuickRequestContact,
} from "@/lib/contact-validation";

type QuickRequestFormProps = {
  bare?: boolean;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  onSuccess?: () => void;
};

export function QuickRequestForm({
  bare = false,
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
  onSuccess,
}: QuickRequestFormProps) {
  const router = useRouter();
  const { messages: t } = useLocale();
  const form = t.request.quickForm;
  const [state, action, pending] = useActionState(submitQuickServiceRequest, {});
  const [, startSubmitTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState("");
  const handledSuccessRef = useRef(false);

  useEffect(() => {
    if (!state.success) return;
    if (handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    formRef.current?.reset();
    setClientError("");
    router.refresh();
    onSuccess?.();
  }, [state.success, router, onSuccess]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError("");
    handledSuccessRef.current = false;

    const formData = new FormData(e.currentTarget);
    const contact = validateQuickRequestContact(
      String(formData.get("phone") ?? ""),
      String(formData.get("email") ?? ""),
    );

    if (!contact.ok) {
      setClientError(
        contactValidationErrorMessage(contact.error, {
          emailRequired: t.errors.contact.emailRequired,
          invalidEmail: t.errors.contact.invalidEmail,
          phoneRequired: t.errors.contact.phoneRequired,
          invalidPhone: t.errors.contact.invalidPhone,
        }),
      );
      return;
    }

    startSubmitTransition(() => {
      action(formData);
    });
  }

  return (
    <RequestFormShell bare={bare}>
      <form ref={formRef} onSubmit={handleSubmit} className="relative space-y-5">
        <FormSecurityFields />
        {state.success ? (
          <div className={cn("rounded-xl px-4 py-4 text-sm", requestSuccessBannerClass)}>
            <p className="font-semibold">
              {state.accountCreated
                ? form.successTitleNewAccount
                : form.successTitle}
            </p>
            <p className="mt-1 text-muted">
              {state.accountCreated
                ? form.successHintNewAccount
                : form.successHint}
            </p>
          </div>
        ) : null}

        {state.error || clientError ? (
          <div className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {clientError || state.error}
          </div>
        ) : null}

        {!state.success ? (
          <>
            <div>
              <Label htmlFor="quick_name">{form.name}</Label>
              <IconInput
                id="quick_name"
                name="name"
                icon={User}
                required
                defaultValue={defaultName}
                placeholder={t.common.placeholderName}
              />
            </div>

            <div>
              <Label htmlFor="quick_phone">{form.phone}</Label>
              <IconInput
                id="quick_phone"
                name="phone"
                icon={Phone}
                required
                dir="ltr"
                defaultValue={defaultPhone}
                placeholder={t.common.placeholderPhone}
              />
            </div>

            <div>
              <Label htmlFor="quick_email">{form.email}</Label>
              <IconInput
                id="quick_email"
                name="email"
                icon={Mail}
                type="email"
                dir="ltr"
                defaultValue={defaultEmail}
                placeholder={t.common.placeholderEmail}
              />
              <p className="mt-1.5 text-xs text-muted">{form.emailHint}</p>
            </div>

            <div>
              <Label htmlFor="quick_message">{form.message}</Label>
              <IconTextarea
                id="quick_message"
                name="message"
                icon={MessageSquare}
                required
                placeholder={t.common.placeholderMessage}
              />
            </div>

            <div>
              <PhotoUploadField
                id="quick_photo"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className={cn(requestBtnFilledClass, "h-12 w-full")}
              disabled={pending}
            >
              {pending ? t.common.sending : form.submit}
            </Button>
          </>
        ) : null}
      </form>
    </RequestFormShell>
  );
}
