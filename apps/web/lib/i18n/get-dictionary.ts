import { messages as arPartial } from "@/messages/ar";
import { messages as en } from "@/messages/en";
import type { Messages } from "@/messages/types";
import type { Locale } from "@/lib/i18n/config";
import { mergeMessages } from "@/lib/i18n/merge-messages";

const dictionaries: Record<Locale, Messages> = {
  en,
  ar: mergeMessages(en, arPartial) as Messages,
};

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries.ar;
}
