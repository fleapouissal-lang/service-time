import { togglePlatformUserAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabels, getTechnicianTypeLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import type { Profile } from "@service-time/types";

export async function PlatformUsersList({ users }: { users: Profile[] }) {
  const { t } = await getServerI18n();
  const roleLabels = getRoleLabels(t);
  const technicianTypeLabels = getTechnicianTypeLabels(t);

  if (users.length === 0) {
    return <p className="text-muted">{t.dashboard.admin.users.noUsers}</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt=""
                  className="size-14 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {user.full_name.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted" dir="ltr">
                  {user.phone ?? t.common.dash}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {roleLabels[user.role]}
                  </Badge>
                  {user.role === "technician" && user.technician_type ? (
                    <Badge variant="outline">
                      {technicianTypeLabels[user.technician_type]}
                    </Badge>
                  ) : null}
                  <Badge variant={user.is_active ? "success" : "outline"}>
                    {user.is_active ? t.common.active : t.common.disabled}
                  </Badge>
                </div>
              </div>
            </div>
            <form action={togglePlatformUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <input
                type="hidden"
                name="is_active"
                value={String(user.is_active)}
              />
              <Button type="submit" variant="outline">
                {user.is_active ? t.common.disable : t.common.enable}
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
