import { getDir, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import type { Messages } from "@/messages/types";

export async function getServerI18n(): Promise<{
  locale: Locale;
  t: Messages;
  dir: "rtl" | "ltr";
}> {
  const locale = await getLocale();
  return {
    locale,
    t: getDictionary(locale),
    dir: getDir(locale),
  };
}
