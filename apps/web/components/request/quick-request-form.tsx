"use client";

import { useActionState, useEffect, useRef } from "react";
import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { submitQuickServiceRequest } from "@/app/request/quick-actions";
import { RequestFormShell } from "@/components/request/request-form-shell";
import { Button } from "@/components/ui/button";
import { IconInput, IconTextarea } from "@/components/ui/icon-field";
import { Label } from "@/components/ui/label";
import { PhotoUploadField } from "@/components/ui/photo-upload-field";
import { useLocale } from "@/lib/i18n/locale-context";

export function QuickRequestForm() {
  const { messages: t } = useLocale();
  const form = t.request.quickForm;
  const [state, action, pending] = useActionState(submitQuickServiceRequest, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <RequestFormShell>
      <form ref={formRef} action={action} className="space-y-5">
        {state.success ? (
          <div className="rounded-xl border border-[#94D4B9]/30 bg-[#94D4B9]/10 px-4 py-4 text-sm text-[#94D4B9]">
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

        {state.error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {state.error}
          </div>
        ) : null}

        <div>
          <Label htmlFor="quick_name">{form.name}</Label>
          <IconInput
            id="quick_name"
            name="name"
            icon={User}
            required
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
            placeholder={t.common.placeholderEmail}
          />
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
          className="h-12 w-full rounded-[20px] bg-[#94D4B9] text-[#050B10] hover:opacity-90"
          disabled={pending}
        >
          {pending ? t.common.sending : form.submit}
        </Button>
      </form>
    </RequestFormShell>
  );
}
