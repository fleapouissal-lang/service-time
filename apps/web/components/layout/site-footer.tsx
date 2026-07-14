"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { getLegalLinks } from "@/lib/i18n/legal-nav";
import { getNavLinks } from "@/lib/i18n/nav";

export function SiteFooter() {
  const { messages } = useLocale();
  const navLinks = getNavLinks(messages);
  const legalLinks = getLegalLinks(messages);
  const phone = "+966 58 381 4214";
  const email = "servicetime10@gmail.com";
  const footer = messages.footer;

  return (
    <footer className="site-footer relative hidden rounded-t-[20px] bg-site-footer text-[var(--site-chrome-text)] md:block">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
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
            {footer.tagline}
          </p>
        </div>

        <div className="text-start">
          <p className="font-semibold text-[var(--site-chrome-accent)]">
            {footer.quickLinks}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
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
            {footer.legal}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {legalLinks.map((link) => (
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
            {footer.contact}
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
              {footer.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[var(--site-chrome-border)] px-4 py-4 text-center text-xs text-[var(--site-chrome-text-muted)]">
        <p>
          © {new Date().getFullYear()} Service Time. {footer.rights}
        </p>
        <nav
          className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          aria-label={footer.legal}
        >
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
