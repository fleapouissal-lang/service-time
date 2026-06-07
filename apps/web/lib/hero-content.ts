export const HERO_CONTENT = {
  titleBefore: "سيارتك تستحق الأفضل،",
  titleHighlight: "ونحن نقدّمه.",
  subtitle:
    "ودّع همّ الصيانة والانتظار — في Service Time نصل إليك في الرياض بفريق فني معتمد، سواء احتجت صيانة دورية، مساعدة طارئة، أو قطع غيار. اطلب الخدمة في دقائق، تابع طلبك لحظة بلحظة، واترك الباقي علينا — سرعة، شفافية، وخدمة تليق بسيارتك.",
  cta: "ابدأ الآن",
} as const;

export function resolveHeroContent(
  cms: Record<string, unknown> | null,
) {
  const migrated = Boolean(cms?.title_before_ar);

  return {
    titleBefore:
      (migrated ? (cms?.title_before_ar as string) : null) ??
      HERO_CONTENT.titleBefore,
    titleHighlight:
      (migrated ? (cms?.title_highlight_ar as string) : null) ??
      HERO_CONTENT.titleHighlight,
    subtitle:
      (migrated ? (cms?.subtitle_ar as string) : null) ??
      HERO_CONTENT.subtitle,
    cta:
      (migrated ? (cms?.cta_ar as string) : null) ?? HERO_CONTENT.cta,
  };
}
