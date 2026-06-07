"use client";

import { useLocale } from "@/lib/i18n/locale-context";

const MARQUEE_COPIES = 4;

function MarqueeStrip({
  copyIndex,
  items,
}: {
  copyIndex: number;
  items: readonly string[];
}) {
  return (
    <div className="trust-marquee__strip flex shrink-0 items-center">
      {items.map((keyword, index) => (
        <span
          key={`${copyIndex}-${keyword}`}
          className="flex shrink-0 items-center"
        >
          <span
            className="trust-marquee__word whitespace-nowrap px-6 text-sm font-medium sm:text-base"
            style={{ animationDelay: `${index * 0.35}s` }}
          >
            {keyword}
          </span>
          <span className="trust-marquee__dot shrink-0" aria-hidden>
            •
          </span>
        </span>
      ))}
    </div>
  );
}

export function TrustMarquee() {
  const { messages: t } = useLocale();
  const items = t.home.trustMarquee.items;

  return (
    <section
      className="trust-marquee w-full border-y border-[#94D4B9] bg-[#060709] py-3.5"
      aria-label={t.home.trustMarquee.ariaLabel}
    >
      <div className="trust-marquee__viewport" dir="ltr">
        <div className="trust-marquee__track flex">
          {Array.from({ length: MARQUEE_COPIES }, (_, i) => (
            <MarqueeStrip key={i} copyIndex={i} items={items} />
          ))}
        </div>
      </div>
    </section>
  );
}
