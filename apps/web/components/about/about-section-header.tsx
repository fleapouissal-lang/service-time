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
      <p className="text-sm font-semibold text-[#94D4B9]">{eyebrow}</p>
      <h2 className="mt-2 font-poppins text-2xl font-bold leading-tight text-white sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-8 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
