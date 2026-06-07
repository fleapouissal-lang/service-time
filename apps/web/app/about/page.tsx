import type { Metadata } from "next";
import { AboutImageTextSection } from "@/components/about/about-image-text-section";
import { AboutValuesCarousel } from "@/components/about/about-values-carousel";
import { AboutCtaSection } from "@/components/home/home-cta-section";
import { getSiteContent } from "@/lib/queries";

export const metadata: Metadata = {
  title: "من نحن",
};

export default async function AboutPage() {
  const about = await getSiteContent("about.summary");

  const title = (about?.title_ar as string) ?? "من نحن";
  const body =
    (about?.body_ar as string) ??
    "Service Time منصة سعودية لصيانة السيارات وطلب قطع الغيار مع تتبع مباشر للفني.";

  return (
    <>
      <div className="mx-auto w-[90%] max-w-[1200px] space-y-20 pb-20 pt-28 sm:space-y-24 sm:pt-32">
        <AboutImageTextSection
          eyebrow="Service Time"
          title={title}
          highlight="في الرياض"
          description={body}
          paragraphs={[
            "نربطك بفنيين محترفين وورش معتمدة — صيانة دورية، طوارئ على الطريق، وطلب قطع غيار من مكان واحد.",
            "تابع حالة طلبك لحظة بلحظة عبر واتساب أو SMS مع رابط تتبع مباشر.",
          ]}
          imageSrc="/about-workshop.png"
          imageAlt="فريق Service Time في الورشة"
          overlayClassName="bg-black/60"
        />

        <AboutImageTextSection
          reverse
          eyebrow="رؤيتنا"
          title="خدمة سيارات"
          highlight="بشفافية"
          description="نؤمن بأن صيانة السيارة يجب أن تكون بسيطة وواضحة — بدون مفاجآت في السعر أو في موعد الوصول."
          paragraphs={[
            "رؤيتنا تسهيل صيانة السيارات في الرياض بخدمة سريعة يمكن الوصول إليها من الهاتف.",
            "نطمح لأن نكون الخيار الأول لكل سائق يبحث عن جودة، سرعة، وثقة.",
          ]}
          imageSrc="/hero-bg.png"
          imageAlt="رؤية Service Time"
          overlayClassName="bg-black/65"
        />

        <AboutImageTextSection
          eyebrow="مهمتنا"
          title="من الطلب"
          highlight="حتى الإنجاز"
          description="مهمتنا ربط العملاء بالفنيين المناسبين في الوقت المناسب، مع تجربة رقمية بسيطة من أول رسالة حتى إتمام الخدمة."
          paragraphs={[
            "1. أرسل طلبك عبر النموذج — صيانة، طوارئ، أو قطع غيار.",
            "2. نؤكد الطلب ونرسل لك رابط تتبع فوري.",
            "3. يصل الفني أو تُجهّز قطعتك — وأنت تتابع كل خطوة.",
          ]}
          imageSrc="/cta-bg.png"
          imageAlt="تجربة Service Time"
          overlayClassName="bg-black/70"
        />

        <AboutValuesCarousel />
      </div>

      <AboutCtaSection />
    </>
  );
}
