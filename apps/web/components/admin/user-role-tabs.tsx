import Link from "next/link";
import type { ProfileRole } from "@service-time/types";
import { getServerI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const TABS: { role: ProfileRole | "all"; labelKey: "all" | ProfileRole }[] = [
  { role: "all", labelKey: "all" },
  { role: "client", labelKey: "client" },
  { role: "technician", labelKey: "technician" },
  { role: "admin", labelKey: "admin" },
];

export async function UserRoleTabs({ active }: { active: ProfileRole | "all" }) {
  const { t } = await getServerI18n();
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
          {t.labels.rolePlural[tab.labelKey]}
        </Link>
      ))}
    </div>
  );
}
