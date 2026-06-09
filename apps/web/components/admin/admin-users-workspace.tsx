"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { Profile } from "@service-time/types";
import type { ProfileRole, TechnicianType } from "@service-time/types";
import {
  getPlatformUserEditDataAction,
  type PlatformUserEditData,
} from "@/app/admin/actions";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { PlatformUserForm } from "@/components/admin/platform-user-form";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminUsersWorkspaceProps = {
  users: Profile[];
  roleLabels: Record<ProfileRole, string>;
  technicianTypeLabels: Record<TechnicianType, string>;
  emptyMessage: string;
  emptyFilteredMessage: string;
  totalCount: number;
  filters: ReactNode;
};

export function AdminUsersWorkspace({
  users,
  roleLabels,
  technicianTypeLabels,
  emptyMessage,
  emptyFilteredMessage,
  totalCount,
  filters,
}: AdminUsersWorkspaceProps) {
  const router = useRouter();
  const { messages: t } = useLocale();
  const [editUser, setEditUser] = useState<PlatformUserEditData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState("");
  const [, startTransition] = useTransition();

  const handleEditUser = (user: Profile) => {
    setEditLoadError("");
    setEditLoading(true);

    startTransition(async () => {
      try {
        const data = await getPlatformUserEditDataAction(user.id);
        if (!data) {
          setEditLoadError(t.errors.admin.userNotFound ?? t.common.error);
          setEditUser(null);
          return;
        }
        setEditUser(data);
      } catch (err) {
        setEditLoadError(
          err instanceof Error
            ? err.message
            : (t.errors.admin.loadUserFailed ?? t.common.error),
        );
        setEditUser(null);
      } finally {
        setEditLoading(false);
      }
    });
  };

  return (
    <div className="space-y-8">
      <PlatformUserForm
        editUser={editUser}
        onCancelEdit={() => setEditUser(null)}
        onSaved={() => router.refresh()}
      />

      {editLoadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {editLoadError}
        </div>
      ) : null}

      {editLoading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : null}

      {filters}

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {totalCount === 0 ? emptyMessage : emptyFilteredMessage}
            </p>
          ) : (
            <AdminUsersTable
              users={users}
              roleLabels={roleLabels}
              technicianTypeLabels={technicianTypeLabels}
              onEditUser={handleEditUser}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
