"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { togglePlatformUserAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@service-time/types";
import { useLocale } from "@/lib/i18n/locale-context";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import type { ProfileRole, TechnicianType } from "@service-time/types";

type AdminUserToggleFormProps = {
  user: Profile;
  roleLabels: Record<ProfileRole, string>;
  technicianTypeLabels: Record<TechnicianType, string>;
};

export function AdminUserToggleForm({
  user,
  roleLabels,
  technicianTypeLabels,
}: AdminUserToggleFormProps) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.usersPage;
  const displayName = getProfileDisplayName(user, locale);
  const [state, action, pending] = useActionState(togglePlatformUserAction, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.fullName}</p>
          <p className="mt-1 font-semibold">{displayName}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.phone}</p>
          <p className="mt-1 text-sm" dir="ltr">
            {user.phone ?? t.common.dash}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{roleLabels[user.role]}</Badge>
        {user.role === "technician" && user.technician_type ? (
          <Badge variant="outline">{technicianTypeLabels[user.technician_type]}</Badge>
        ) : null}
        <Badge variant={user.is_active ? "success" : "outline"}>
          {user.is_active ? t.common.active : t.common.inactive}
        </Badge>
      </div>

      {state.error ? (
        <div
          className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-2.5 text-sm text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <form action={action}>
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="is_active" value={String(user.is_active)} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t.common.loading}
            </>
          ) : user.is_active ? (
            t.common.disable
          ) : (
            t.common.enable
          )}
        </Button>
      </form>
    </div>
  );
}
