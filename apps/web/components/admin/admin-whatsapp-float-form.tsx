"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveWhatsAppFloatAction } from "@/app/admin/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AdminWhatsAppFloatSettings } from "@/lib/whatsapp-float-shared";

type AdminWhatsAppFloatFormProps = {
  settings: AdminWhatsAppFloatSettings;
};

function fieldClass() {
  return "h-11 rounded-xl border border-border bg-background px-3";
}

export function AdminWhatsAppFloatForm({ settings }: AdminWhatsAppFloatFormProps) {
  const { messages } = useLocale();
  const p = messages.dashboard.admin.whatsappFloatPage;
  const router = useRouter();
  const [state, action, pending] = useActionState(saveWhatsAppFloatAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{p.hint}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{p.formTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={settings.is_active}
                className="size-4 rounded border-border"
              />
              {p.active}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{p.phone}</span>
                <input
                  name="phone"
                  dir="ltr"
                  defaultValue={settings.phone}
                  placeholder="+966583814214"
                  className={fieldClass()}
                />
                <span className="text-xs text-muted">{p.phoneHint}</span>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{p.customUrl}</span>
                <input
                  name="custom_url"
                  dir="ltr"
                  defaultValue={settings.custom_url}
                  placeholder="https://wa.me/966583814214"
                  className={fieldClass()}
                />
                <span className="text-xs text-muted">{p.customUrlHint}</span>
              </label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">{p.messageAr}</span>
                <textarea
                  name="message_ar"
                  rows={3}
                  defaultValue={settings.message_ar}
                  className="rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="grid gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">{p.messageEn}</span>
                <textarea
                  name="message_en"
                  rows={3}
                  defaultValue={settings.message_en}
                  className="rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            {state.error ? (
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-emerald-600" role="status">
                {p.saveSuccess}
              </p>
            ) : null}

            <PendingSubmitButton
              pending={pending}
              pendingLabel={messages.common.saving}
            >
              {p.saveChanges}
            </PendingSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
