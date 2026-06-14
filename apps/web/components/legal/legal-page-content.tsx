import {
  sectionEyebrowClass,
  sectionTitleH1Class,
} from "@/lib/section-styles";

export type LegalPageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly {
    title: string;
    paragraphs: readonly string[];
  }[];
};

type LegalPageContentProps = {
  page: LegalPageCopy;
};

export function LegalPageContent({ page }: LegalPageContentProps) {
  return (
    <article className="legal-page mx-auto w-[90%] max-w-[820px] pb-24 pt-28 sm:pb-28 sm:pt-32">
      <header className="text-start">
        <p className={sectionEyebrowClass}>{page.eyebrow}</p>
        <h1 className={sectionTitleH1Class}>{page.title}</h1>
        <p className="mt-5 text-base leading-8 text-muted">{page.intro}</p>
      </header>

      <div className="mt-12 space-y-10">
        {page.sections.map((section) => (
          <section key={section.title} className="legal-page__section text-start">
            <h2 className="text-xl font-bold text-[var(--section-title)]">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
