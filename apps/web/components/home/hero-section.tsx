import Image from "next/image";
import Link from "next/link";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";

type HeroSectionProps = {
  titleBefore: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaHref?: string;
};

export function HeroSection({
  titleBefore,
  titleHighlight,
  subtitle,
  cta,
  ctaHref = "/request",
}: HeroSectionProps) {
  return (
    <section className="relative -mt-20 min-h-[100svh] w-full overflow-hidden bg-[#050B10] pt-20">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/hero-bg-mobile.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[28%_center] md:hidden"
        />
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center md:block"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#050B10]/80 via-[#050B10]/40 to-transparent md:from-[#050B10]/60 md:via-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-[90%] max-w-[1200px] items-center py-20 sm:py-28 lg:py-24">
        <div className="animate-fade-up max-w-xl space-y-4 text-start">
          <h1 className="font-poppins text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            {titleBefore}{" "}
            <span className="text-[#94D4B9]">{titleHighlight}</span>
          </h1>

          <p className="text-base leading-7 text-white/90 sm:text-lg">
            {subtitle}
          </p>

          <Link
            href={ctaHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] px-8 text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
          >
            {cta}
            <LocaleForwardArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
