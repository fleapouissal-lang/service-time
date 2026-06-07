const KEYWORDS = [
  "صيانة دورية",
  "خدمة طوارئ 24/7",
  "فنيون معتمدون",
  "وصول سريع",
  "ورشة متنقلة",
  "تتبع مباشر",
  "أسعار شفافة",
  "خدمة في موقعك",
  "قطع غيار أصلية",
  "دعم فني محترف",
  "خدمة موثوقة",
  "تغطية واسعة",
] as const;

const MARQUEE_COPIES = 4;

function MarqueeStrip({ copyIndex }: { copyIndex: number }) {
  return (
    <div className="trust-marquee__strip flex shrink-0 items-center">
      {KEYWORDS.map((keyword, index) => (
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
  return (
    <section
      className="trust-marquee w-full border-y border-[#94D4B9] bg-[#060709] py-3.5"
      aria-label="مزايا Service Time"
    >
      <div className="trust-marquee__viewport" dir="ltr">
        <div className="trust-marquee__track flex">
          {Array.from({ length: MARQUEE_COPIES }, (_, i) => (
            <MarqueeStrip key={i} copyIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
