export const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/services", label: "الخدمات" },
  { href: "/request", label: "طلب خدمة" },
  { href: "/spare-parts", label: "قطع الغيار" },
  { href: "/locations", label: "مواقعنا" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل" },
] as const;

export const SERVICE_TYPE_LABELS = {
  periodic_maintenance: "صيانة دورية",
  emergency: "طوارئ",
  spare_parts: "قطع غيار",
} as const;

export const EXECUTION_METHOD_LABELS = {
  workshop_visit: "زيارة الورشة",
  mobile_workshop: "ورشة متنقلة",
} as const;

export const STATUS_LABELS = {
  received: "تم استلام الطلب",
  in_progress: "جاري التنفيذ",
  on_the_way: "الفني في الطريق",
  arrived: "وصل الفني",
  completed: "مكتمل",
  cancelled: "ملغي",
} as const;

export const STATUS_ORDER = [
  "received",
  "in_progress",
  "on_the_way",
  "arrived",
  "completed",
] as const;
