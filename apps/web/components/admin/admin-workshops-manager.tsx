"use client";

import { useRouter } from "next/navigation";
import type { WorkshopBranch } from "@/lib/localized-content";
import { AdminWorkshopForm } from "@/components/admin/admin-workshop-form";

type AdminWorkshopsManagerProps = {
  workshops: WorkshopBranch[];
};

export function AdminWorkshopsManager({ workshops }: AdminWorkshopsManagerProps) {
  const router = useRouter();
  const canDelete = workshops.length > 1;

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AdminWorkshopForm onSaved={refresh} />

      {workshops.length > 0 ? (
        <div className="space-y-6">
          {workshops.map((branch) => (
            <AdminWorkshopForm
              key={branch.id}
              branch={branch}
              canDelete={canDelete}
              onSaved={refresh}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
