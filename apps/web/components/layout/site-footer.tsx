"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { getNavLinks } from "@/lib/i18n/nav";

export function SiteFooter() {
  const { messages } = useLocale();
  const navLinks = getNavLinks(messages);
  const phone = "+966500000001";
  const email = "info@servicetime.sa";

  return (
    <footer className="site-footer relative rounded-t-[20px] bg-site-footer text-[var(--site-chrome-text)]">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="text-start">
          <Link href="/" className="inline-block">
            <Image
              src="/logos/banner.png"
              alt="Service Time"
              width={280}
              height={72}
              className="h-14 w-auto max-w-full object-contain brightness-[1.12] contrast-[1.05]"
            />
          </Link>
          <p className="mt-4 text-sm leading-7 text-[var(--site-chrome-text-muted)]">
            {messages.footer.tagline}
          </p>
        </div>

        <div className="text-start">
          <p className="font-semibold text-[var(--site-chrome-accent)]">
            {messages.footer.quickLinks}
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:grid-cols-1 md:space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-normal text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-start">
          <p className="font-semibold text-[var(--site-chrome-accent)]">
            {messages.footer.contact}
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-xs leading-snug sm:text-sm md:grid-cols-1 md:space-y-2.5">
            <li>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                dir="ltr"
                className="inline-block font-normal text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
              >
                {phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="inline-block break-all font-normal text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
              >
                {email}
              </a>
            </li>
            <li className="text-[var(--site-chrome-text-muted)] md:leading-7">
              {messages.footer.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[var(--site-chrome-border)] py-4 text-center text-xs text-[var(--site-chrome-text-muted)]">
        © {new Date().getFullYear()} Service Time. {messages.footer.rights}
      </div>
    </footer>
  );
}
