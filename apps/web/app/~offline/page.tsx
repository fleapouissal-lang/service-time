import Link from "next/link";
import { WifiOff } from "lucide-react";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { getServerI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export default async function OfflinePage() {
  const { t } = await getServerI18n();
  const copy = t.pwa.offline;

  return (
    <div className="mx-auto flex min-h-[60vh] w-[90%] max-w-lg flex-col items-center justify-center py-20 text-center">
      <span className={cn("mb-6 flex size-16 items-center justify-center rounded-2xl", iconAccentBgClass)}>
        <WifiOff className={cn("size-8", iconAccentClass)} aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p className="mt-3 text-sm leading-7 text-muted">{copy.description}</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-[20px] bg-[#94D4B9] px-6 text-sm font-semibold text-[#050B10] hover:opacity-90"
      >
        {copy.retry}
      </Link>
    </div>
  );
}
