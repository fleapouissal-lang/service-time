"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { togglePlatformUserAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

type PlatformUserToggleButtonProps = {
  userId: string;
  isActive: boolean;
};

export function PlatformUserToggleButton({
  userId,
  isActive,
}: PlatformUserToggleButtonProps) {
  const { messages: t } = useLocale();
  const [state, action, pending] = useActionState(togglePlatformUserAction, {});

  return (
    <div className="space-y-2">
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <form action={action}>
        <input type="hidden" name="id" value={userId} />
        <input type="hidden" name="is_active" value={String(isActive)} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t.common.loading}
            </>
          ) : isActive ? (
            t.common.disable
          ) : (
            t.common.enable
          )}
        </Button>
      </form>
    </div>
  );
}
