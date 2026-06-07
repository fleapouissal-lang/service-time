import type { Messages } from "@/messages/types";

export function getNavLinks(messages: Messages) {
  return [
    { href: "/", label: messages.nav.home },
    { href: "/services", label: messages.nav.services },
    { href: "/request", label: messages.nav.request },
    { href: "/spare-parts", label: messages.nav.spareParts },
    { href: "/locations", label: messages.nav.locations },
    { href: "/about", label: messages.nav.about },
    { href: "/contact", label: messages.nav.contact },
  ] as const;
}
