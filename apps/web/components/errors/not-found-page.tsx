import Link from "next/link";
import { CarFront, Home, MessageCircle, Wrench } from "lucide-react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { sectionEyebrowClass } from "@/lib/section-styles";

export type NotFoundCopy = {
  eyebrow: string;
  title: string;
  description: string;
  backHome: string;
  requestService: string;
  browseServices: string;
  contactUs: string;
  quickLinksAria: string;
};

type NotFoundPageProps = {
  copy: NotFoundCopy;
};

const quickLinks = [
  { key: "services" as const, href: "/services", icon: Wrench },
  { key: "contact" as const, href: "/contact", icon: MessageCircle },
] as const;

export function NotFoundPage({ copy }: NotFoundPageProps) {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__glow" aria-hidden />

      <div className="not-found-page__inner">
        <div className="not-found-page__panel">
          <div className="not-found-page__icon-wrap" aria-hidden>
            <CarFront className="not-found-page__icon" strokeWidth={1.5} />
          </div>

          <p className={sectionEyebrowClass}>{copy.eyebrow}</p>

          <p className="not-found-page__code" aria-hidden>
            404
          </p>

          <h1 id="not-found-title" className="not-found-page__title">
            {copy.title}
          </h1>

          <p className="not-found-page__description">{copy.description}</p>

          <div className="not-found-page__actions">
            <Link href="/" className="not-found-page__btn not-found-page__btn--primary">
              <Home className="size-4 shrink-0" aria-hidden />
              {copy.backHome}
              <LocaleForwardArrow />
            </Link>

            <Link
              href="/request"
              className="not-found-page__btn not-found-page__btn--secondary"
            >
              {copy.requestService}
              <LocaleForwardArrow />
            </Link>
          </div>

          <nav
            className="not-found-page__links"
            aria-label={copy.quickLinksAria}
          >
            {quickLinks.map(({ key, href, icon: Icon }) => (
              <Link key={key} href={href} className="not-found-page__link">
                <Icon className="size-4 shrink-0" aria-hidden />
                {key === "services" ? copy.browseServices : copy.contactUs}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
