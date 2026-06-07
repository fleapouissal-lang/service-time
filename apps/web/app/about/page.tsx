import type { Metadata } from "next";
import { AboutImageTextSection } from "@/components/about/about-image-text-section";
import { AboutValuesCarousel } from "@/components/about/about-values-carousel";
import { AboutCtaSection } from "@/components/home/home-cta-section";
import { getServerI18n } from "@/lib/i18n/server";
import { getSiteContent } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.about };
}

export default async function AboutPage() {
  const { t, locale } = await getServerI18n();
  const about = await getSiteContent("about.summary");

  const title =
    (locale === "ar"
      ? (about?.title_ar as string)
      : (about?.title_en as string)) ?? t.about.defaultTitle;
  const body =
    (locale === "ar"
      ? (about?.body_ar as string)
      : (about?.body_en as string)) ?? t.about.defaultBody;

  return (
    <>
      <div className="mx-auto w-[90%] max-w-[1200px] space-y-20 pb-20 pt-28 sm:space-y-24 sm:pt-32">
        <AboutImageTextSection
          eyebrow={t.about.summary.eyebrow}
          title={title}
          highlight={t.about.summary.highlight}
          description={body}
          paragraphs={[...t.about.summary.paragraphs]}
          imageSrc="/about-workshop.png"
          imageAlt={t.about.summary.imageAlt}
          overlayClassName="bg-black/60"
        />

        <AboutImageTextSection
          reverse
          eyebrow={t.about.vision.eyebrow}
          title={t.about.vision.title}
          highlight={t.about.vision.highlight}
          description={t.about.vision.description}
          paragraphs={[...t.about.vision.paragraphs]}
          imageSrc="/hero-bg.png"
          imageAlt={t.about.vision.imageAlt}
          overlayClassName="bg-black/65"
        />

        <AboutImageTextSection
          eyebrow={t.about.mission.eyebrow}
          title={t.about.mission.title}
          highlight={t.about.mission.highlight}
          description={t.about.mission.description}
          paragraphs={[...t.about.mission.paragraphs]}
          imageSrc="/cta-bg.png"
          imageAlt={t.about.mission.imageAlt}
          overlayClassName="bg-black/70"
        />

        <AboutValuesCarousel />
      </div>

      <AboutCtaSection />
    </>
  );
}
