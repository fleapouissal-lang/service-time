import type { Messages } from "@/messages/types";

export function getLegalLinks(messages: Messages) {
  return [
    { href: "/legal/privacy", label: messages.footer.privacy },
    { href: "/legal/terms", label: messages.footer.terms },
    { href: "/legal/notice", label: messages.footer.legalNotice },
  ] as const;
}
