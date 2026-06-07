"use client";

import { togglePlatformUserAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@service-time/types";
import { useLocale } from "@/lib/i18n/locale-context";
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
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.usersPage;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted">{p.detail.fullName}</p>
          <p className="mt-1 font-semibold">{user.full_name}</p>
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

      <form action={togglePlatformUserAction}>
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="is_active" value={String(user.is_active)} />
        <Button type="submit" variant="outline">
          {user.is_active ? t.common.disable : t.common.enable}
        </Button>
      </form>
    </div>
  );
}
