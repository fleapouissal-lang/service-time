"use client";

import { useActionState, useEffect, useRef } from "react";
import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { submitContactMessage } from "@/app/contact/actions";
import { FormSecurityFields } from "@/components/forms/form-security-fields";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import { surfaceCardClass } from "@/lib/card-surface";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const { messages: t } = useLocale();
  const form = t.contact.form;
  const [state, action, pending] = useActionState(submitContactMessage, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={action}
      className={cn("relative space-y-5 p-6 sm:p-8", surfaceCardClass)}
    >
      <FormSecurityFields />
      {state.success ? (
        <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 text-center">
          <p className="text-base font-semibold text-primary">
            {form.successTitle}
          </p>
          <p className="mt-1 text-sm text-muted">{form.successHint}</p>
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      ) : null}

      <div>
        <Label htmlFor="contact_name">{form.name}</Label>
        <IconInput
          id="contact_name"
          name="name"
          icon={User}
          required
          placeholder={t.common.placeholderName}
        />
      </div>

      <div>
        <Label htmlFor="contact_phone">{form.phone}</Label>
        <IconInput
          id="contact_phone"
          name="phone"
          icon={Phone}
          required
          dir="ltr"
          placeholder={t.common.placeholderPhone}
        />
      </div>

      <div>
        <Label htmlFor="contact_email">{form.email}</Label>
        <IconInput
          id="contact_email"
          name="email"
          icon={Mail}
          type="email"
          dir="ltr"
          placeholder={t.common.placeholderEmail}
        />
      </div>

      <div>
        <Label htmlFor="contact_message">{form.message}</Label>
        <IconTextarea
          id="contact_message"
          name="message"
          icon={MessageSquare}
          required
          placeholder={t.common.placeholderMessage}
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:brightness-100 hover:opacity-90"
        disabled={pending}
      >
        {pending ? t.common.sending : form.submit}
      </Button>
    </form>
  );
}
