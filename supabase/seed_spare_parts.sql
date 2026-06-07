-- 9 spare_parts avec images, prix (SAR) et stock
-- Prérequis : migrations price + stock + i18n + fichiers dans apps/web/public/spare-parts/
-- Exécuter dans Supabase SQL Editor

DELETE FROM public.spare_part_order_items;
DELETE FROM public.spare_part_orders;
DELETE FROM public.spare_parts;

INSERT INTO public.spare_parts (
  id,
  name_ar,
  name_en,
  description_ar,
  description_en,
  category,
  details,
  details_en,
  img,
  price,
  stock_quantity,
  is_active
) VALUES
  (
    'b2000002-0002-4002-8002-000000000001',
    'قرص فرامل',
    'Brake disc',
    'قرص فرامل عالي الأداء — جودة OEM وبدائل معتمدة',
    'High-performance brake disc — OEM quality and approved alternatives',
    'فرامل',
    'متوفر بمقاسات متعددة — يرجى ذكر موديل السيارة',
    'Available in multiple sizes — please specify your car model',
    '/spare-parts/disque-frein.png',
    189.00,
    24,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000002',
    'محور العجلة',
    'Wheel hub',
    'محور عجلة مع رولمان بلي — تركيب دقيق',
    'Wheel hub with bearing — precision fit',
    'هيكل',
    'متوفر لمعظم موديلات السيارات',
    'Available for most car models',
    '/spare-parts/moyeu-roue.png',
    320.00,
    12,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000003',
    'قرص كلتش',
    'Clutch disc',
    'قرص كلتش بسطح احتكاك مقاوم للحرارة',
    'Clutch disc with heat-resistant friction surface',
    'نقل الحركة',
    'يرجى ذكر نوع ناقل الحركة (يدوي / أوتوماتيك)',
    'Please specify transmission type (manual / automatic)',
    '/spare-parts/disque-embrayage.png',
    275.00,
    8,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000004',
    'مولد كهربائي',
    'Alternator',
    'Alternator — شحن البطارية وتشغيل الأنظمة الكهربائية',
    'Alternator — charges the battery and powers electrical systems',
    'كهرباء',
    'فحص وتركيب متاح في الورشة أو المتنقلة',
    'Inspection and installation available at workshop or mobile service',
    '/spare-parts/alternateur.png',
    450.00,
    5,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000005',
    'مضخة ماء',
    'Water pump',
    'مضخة تبريد المحرك — أداء موثوق',
    'Engine cooling water pump — reliable performance',
    'تبريد',
    'متوافقة مع أنظمة التبريد الحديثة',
    'Compatible with modern cooling systems',
    '/spare-parts/pompe-eau.png',
    210.00,
    15,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000006',
    'فلتر هواء',
    'Air filter',
    'فلتر هواء محرك — حماية فعالة من الغبار',
    'Engine air filter — effective dust protection',
    'فلاتر',
    'يرجى ذكر سنة الصنع وموديل السيارة',
    'Please specify year and car model',
    '/spare-parts/filtre-air.png',
    45.00,
    50,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000007',
    'حاقنات وقود',
    'Fuel injectors',
    'حاقنات وقود — رش دقيق واستهلاك محسّن',
    'Fuel injectors — precise spray and improved consumption',
    'وقود',
    'مجموعة أو قطعة فردية حسب الطلب',
    'Set or individual part on request',
    '/spare-parts/injecteurs.png',
    380.00,
    0,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000008',
    'ذراع تعليق',
    'Control arm',
    'ذراع تحكم أمامي — استقرار وقيادة آمنة',
    'Front control arm — stability and safe handling',
    'تعليق',
    'يرجى ذكر رقم الشاسيه (VIN)',
    'Please provide VIN number',
    '/spare-parts/bras-suspension.png',
    295.00,
    10,
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000009',
    'سير توقيت',
    'Timing belt',
    'سير توقيت مع شداد — مجموعة كاملة',
    'Timing belt with tensioner — complete kit',
    'نقل الحركة',
    'تركيب احترافي موصى به عند الاستبدال',
    'Professional installation recommended when replacing',
    '/spare-parts/courroie.png',
    165.00,
    18,
    true
  );
