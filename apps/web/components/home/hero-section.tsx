import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <section
      className="relative -mt-20 min-h-screen w-full overflow-hidden bg-[#050B10] bg-cover bg-center bg-no-repeat pt-20"
      style={{ backgroundImage: "url('/hero-bg.png')" }}
    >
      <div className="relative mx-auto flex min-h-screen w-[90%] max-w-[1200px] items-center py-28 lg:py-24">
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
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
