"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { saveContentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminContentItemFormProps = {
  contentKey: string;
  valueJson: string;
};

export function AdminContentItemForm({
  contentKey,
  valueJson,
}: AdminContentItemFormProps) {
  const { messages: t } = useLocale();
  const c = t.dashboard.admin.content;
  const [state, action, pending] = useActionState(saveContentAction, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label>{c.key}</Label>
        <p className="mt-1 font-mono text-sm" dir="ltr">
          {contentKey}
        </p>
        <input type="hidden" name="key" value={contentKey} />
      </div>
      <div>
        <Label>{c.valueJson}</Label>
        <Textarea
          name="value_json"
          defaultValue={valueJson}
          className="mt-1 font-mono text-xs"
          dir="ltr"
          rows={6}
        />
      </div>

      {state.error ? (
        <div
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          role="status"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {c.saveSuccess}
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t.common.saving}
          </>
        ) : (
          t.common.save
        )}
      </Button>
    </form>
  );
}
