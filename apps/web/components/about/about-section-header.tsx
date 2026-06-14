import {
  sectionEyebrowClass,
  sectionTitleH2MdClass,
} from "@/lib/section-styles";

type AboutSectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export function AboutSectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
}: AboutSectionHeaderProps) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "text-start"}>
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 className={sectionTitleH2MdClass}>{title}</h2>
      {description ? (
        <p className="mt-3 text-base leading-8 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
