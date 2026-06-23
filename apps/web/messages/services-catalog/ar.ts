export const servicesCatalog = {
  eyebrow: "الخدمات الرئيسية",
  title: "اختر الخدمة وأرسل طلبك",
  description:
    "صيانة، خدمة متنقلة، قطع غيار، سطحات، وأكثر — اختر الخيار الفرعي وأرسل طلباً واحداً.",
  expandCategory: "عرض الخيارات الفرعية",
  collapseCategory: "إخفاء الخيارات الفرعية",
  selectSubOption: "اختر خياراً فرعياً",
  selectPlaceholder: "اختر خياراً…",
  requestFormTitle: "أرسل طلبك",
  requestFormHint: "املأ بياناتك وسنتواصل معك في أقرب وقت.",
  loginRequiredNote:
    "يجب تسجيل الدخول بحساب عميل لإرسال الطلب. نوع الخدمة والتفاصيل تُضاف تلقائياً.",
  fullRequestCta: "طلب كامل مع تتبع مباشر",
  openLink: "متابعة",
  browseParts: "تصفّح متجر قطع الغيار",
  trackExternal: "متابعة الطلبات الخارجية",
  messagePrefix: "الخدمة",
  categories: [
    {
      id: "general_maintenance",
      title: "صيانة عامة",
      description:
        "صيانة دورية في الورشة — زيت، فرامل، مكيف، فحص شامل، والمزيد.",
      subOptions: [
        {
          id: "oil_change",
          label: "تغيير الزيت والفلتر",
          description: "تغيير زيت المحرك والفلتر مع فحص سريع.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "brake_service",
          label: "فحص وصيانة الفرامل",
          description: "فحص تيل وديسك الفرامل وسائل الفرامل.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "ac_service",
          label: "صيانة المكيف",
          description: "فحص وتعبئة أو إصلاح نظام التكييف.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "full_inspection",
          label: "فحص شامل للسيارة",
          description: "فحص كامل قبل السفر أو الشراء.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "battery_check",
          label: "فحص واستبدال البطارية",
          description: "اختبار البطارية واستبدالها في الورشة.",
          action: "full|periodic_maintenance|workshop_visit",
        },
      ],
    },
    {
      id: "mobile_maintenance",
      title: "صيانة متنقلة",
      description:
        "فني معتمد يصل إلى موقعك في أي مكان بالرياض.",
      subOptions: [
        {
          id: "mobile_oil",
          label: "تغيير زيت متنقل",
          description: "تغيير الزيت والفلتر عند منزلك أو مكتبك.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_diagnostics",
          label: "فحص وتشخيص في الموقع",
          description: "تشخيص إلكتروني وقراءة الأعطال عند موقعك.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_battery",
          label: "خدمة بطارية متنقلة",
          description: "فحص بطارية، تشغيل، أو استبدال في الموقع.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_ac",
          label: "صيانة مكيف متنقلة",
          description: "فحص وصيانة أساسية للمكيف عند موقعك.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
      ],
    },
    {
      id: "spare_parts",
      title: "طلب قطع غيار",
      description:
        "اطلب قطعاً أصلية أو متوافقة — تصفّح المتجر أو أرسل طلباً مخصصاً.",
      subOptions: [
        {
          id: "browse_store",
          label: "تصفّح دليل قطع الغيار",
          description: "ابحث عن القطعة، أضف للسلة، واطلب أونلاين.",
          action: "link|/spare-parts",
        },
        {
          id: "custom_part",
          label: "طلب قطعة غير موجودة",
          description: "القطعة غير مدرجة؟ أرسل التفاصيل ونوفرها لك.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "engine_parts",
          label: "قطع المحرك والميكانيك",
          description: "فلاتر، سيور، طرمبات، ومكونات المحرك.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "body_parts",
          label: "قطع الهيكل والخارجية",
          description: "صدامات، إضاءة، مرايا، وأجزاء الهيكل.",
          action: "full|periodic_maintenance|workshop_visit",
        },
      ],
    },
    {
      id: "flatbed",
      title: "سطحة",
      description:
        "نقل وإنقاذ المركبات — داخل المدينة، الطرق السريعة، ومواقع الحوادث.",
      subOptions: [
        {
          id: "city_tow",
          label: "سطحة داخل الرياض",
          description: "سحب ونقل سيارتك داخل مدينة الرياض.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "highway_tow",
          label: "إنقاذ على الطريق السريع",
          description: "إنقاذ ونقل من الطرق السريعة والطرق الخارجية.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "accident_transport",
          label: "نقل من موقع حادث",
          description: "نقل آمن بعد تصادم أو تعطل تام للمركبة.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "long_distance",
          label: "نقل بين المدن",
          description: "نقل بالسطحة إلى مدينة أو ورشة أخرى.",
          action: "full|emergency|mobile_workshop",
        },
      ],
    },
    {
      id: "breakdown_accidents",
      title: "أعطال وحوادث",
      description:
        "مساعدة على الطريق ودعم عند تعطل السيارة أو بعد حادث.",
      subOptions: [
        {
          id: "roadside_breakdown",
          label: "عطل على الطريق",
          description: "تشخيص وإصلاح في الموقع قدر الإمكان.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "jump_start",
          label: "تشغيل البطارية",
          description: "بطارية فارغة — تشغيل سريع في موقعك.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "flat_tire",
          label: "إصلاح / تبديل إطار",
          description: "تبديل الإطار أو إصلاح مؤقت على الطريق.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "accident_support",
          label: "دعم بعد حادث",
          description: "توجيه، تنسيق السطحة، والخطوات التالية.",
          action: "full|emergency|mobile_workshop",
        },
      ],
    },
    {
      id: "external_tracking",
      title: "متابعة طلبات خارجية",
      description:
        "تابع الطلبات خارج المنصة أو عبر شريك — سجّل الدخول للمتابعة.",
      subOptions: [
        {
          id: "track_with_code",
          label: "متابعة برمز التتبع",
          description: "أدخل الرمز المرسل عبر SMS أو واتساب.",
          action: "link|/login?next=/client/track",
        },
        {
          id: "view_orders",
          label: "عرض طلباتي",
          description: "سجّل الدخول لرؤية جميع طلبات الصيانة والقطع.",
          action: "link|/login?next=/client/orders",
        },
        {
          id: "external_inquiry",
          label: "استفسار عن طلب خارجي",
          description: "اسأل عن طلب تم عبر الهاتف أو شريك خارجي.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
      ],
    },
  ],
} as const;
