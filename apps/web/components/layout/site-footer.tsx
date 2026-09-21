"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicFooterContent } from "@/lib/footer-content-shared";

type SiteFooterProps = {
  content: PublicFooterContent;
};

export function SiteFooter({ content }: SiteFooterProps) {
  const phoneHref = content.phone.replace(/[^\d+]/g, "");

  return (
    <footer className="site-footer relative hidden rounded-t-[20px] bg-site-footer text-[var(--site-chrome-text)] md:block">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="text-start">
          <Link href="/" className="inline-block">
            <Image
              src="/logos/banner.png"
              alt={content.brandTitle || "Service Time"}
              width={280}
              height={72}
              className="h-14 w-auto max-w-full object-contain brightness-[1.12] contrast-[1.05]"
            />
          </Link>
          {content.brandTitle ? (
            <p className="mt-3 text-base font-semibold text-[var(--site-chrome-accent)]">
              {content.brandTitle}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-[var(--site-chrome-text-muted)]">
            {content.tagline}
          </p>
        </div>

        <div className="text-start">
          <p className="font-semibold text-[var(--site-chrome-accent)]">
            {content.sectionQuick}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {content.quickLinks.map((link) => (
              <li key={link.id}>
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
            {content.sectionLegal}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {content.legalLinks.map((link) => (
              <li key={link.id}>
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
            {content.sectionContact}
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-xs leading-snug sm:text-sm md:grid-cols-1 md:space-y-2.5">
            <li>
              <a
                href={`tel:${phoneHref}`}
                dir="ltr"
                className="inline-block font-normal text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
              >
                {content.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${content.email}`}
                dir="ltr"
                className="inline-block break-all font-normal text-[var(--site-chrome-text)] transition-all duration-200 hover:font-bold"
              >
                {content.email}
              </a>
            </li>
            <li className="text-[var(--site-chrome-text-muted)] md:leading-7">
              {content.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[var(--site-chrome-border)] px-4 py-4 text-center text-xs text-[var(--site-chrome-text-muted)]">
        <p>
          © {new Date().getFullYear()} {content.brandTitle || "Service Time"}.{" "}
          {content.rights}
        </p>
        <nav
          className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          aria-label={content.sectionLegal}
        >
          {content.legalLinks.map((link) => (
            <Link
              key={link.id}
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
