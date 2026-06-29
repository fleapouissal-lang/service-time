import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.clientVehicles.addTitle };
}

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AddClientVehiclePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? `?next=${encodeURIComponent(params.next)}`
      : "";

  redirect(`/client/vehicles${next}`);
}
