import Link from "next/link";
import type { ProfileRole } from "@service-time/types";
import { cn } from "@/lib/utils";

const TABS: { role: ProfileRole | "all"; label: string }[] = [
  { role: "all", label: "الكل" },
  { role: "client", label: "عملاء" },
  { role: "technician", label: "فنيون" },
  { role: "admin", label: "مديرون" },
];

export function UserRoleTabs({ active }: { active: ProfileRole | "all" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.role}
          href={
            tab.role === "all" ? "/admin/users" : `/admin/users?role=${tab.role}`
          }
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors",
            active === tab.role
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-primary/5",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export const PLATFORM_ROLE_LABELS: Record<ProfileRole, string> = {
  client: "عميل",
  technician: "فني",
  admin: "مدير",
};
