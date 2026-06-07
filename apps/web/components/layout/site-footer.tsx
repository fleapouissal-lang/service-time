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
    <footer className="site-footer relative rounded-t-[20px] bg-[#050B10] text-white">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/logos/banner.png"
              alt="Service Time"
              width={280}
              height={72}
              className="h-14 w-auto max-w-full object-contain brightness-[1.12] contrast-[1.05]"
              unoptimized
            />
          </Link>
          <p className="mt-4 text-sm leading-7 text-white/85">
            {messages.footer.tagline}
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#94D4B9]">
            {messages.footer.quickLinks}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-normal text-white transition-all duration-200 hover:font-bold hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-[#94D4B9]">
            {messages.footer.contact}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white">
            <li
              dir="ltr"
              className="text-end font-normal transition-all duration-200 hover:font-bold"
            >
              {phone}
            </li>
            <li
              dir="ltr"
              className="font-normal transition-all duration-200 hover:font-bold"
            >
              {email}
            </li>
            <li className="text-white/85">{messages.footer.location}</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-[#94D4B9]/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Service Time. {messages.footer.rights}
      </div>
    </footer>
  );
}
