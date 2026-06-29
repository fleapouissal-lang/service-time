import type { Metadata } from "next";
import { ClientVehiclesList } from "@/components/client/vehicles/client-vehicles-list";
import { requireProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.clientVehicles.title };
}

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ClientVehiclesPage({ searchParams }: PageProps) {
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const params = await searchParams;
  const nextPath =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  const vehicles = await getClientVehicles(profile.id);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <ClientVehiclesList initialVehicles={vehicles} nextPath={nextPath} />
    </div>
  );
}
