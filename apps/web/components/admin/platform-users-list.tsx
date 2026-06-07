import { togglePlatformUserAction } from "@/app/admin/actions";
import { PLATFORM_ROLE_LABELS } from "@/components/admin/user-role-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@service-time/types";

export function PlatformUsersList({ users }: { users: Profile[] }) {
  if (users.length === 0) {
    return <p className="text-muted">لا يوجد مستخدمون في هذا القسم.</p>;
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
                  {user.phone ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {PLATFORM_ROLE_LABELS[user.role]}
                  </Badge>
                  {user.role === "technician" ? (
                    <Badge variant="outline">
                      {user.technician_type === "mobile" ? "متنقل" : "ورشة"}
                    </Badge>
                  ) : null}
                  <Badge variant={user.is_active ? "success" : "outline"}>
                    {user.is_active ? "نشط" : "معطّل"}
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
                {user.is_active ? "تعطيل" : "تفعيل"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
