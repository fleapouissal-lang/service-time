-- Service Time — Données de démonstration MVP
-- Exécuter APRÈS : supabase/migrations/20260603150000_initial_schema.sql
--
-- Usage :
--   Supabase SQL Editor → coller et exécuter
--   ou : npm run db:seed

-- ---------------------------------------------------------------------------
-- Nettoyage (ordre inverse des FK) — safe re-run
-- ---------------------------------------------------------------------------
DELETE FROM public.notifications_log;
DELETE FROM public.request_photos;
DELETE FROM public.request_status_history;
DELETE FROM public.service_requests;
DELETE FROM public.technician_locations;
DELETE FROM public.spare_parts;
DELETE FROM public.services;
DELETE FROM public.site_content;

-- ---------------------------------------------------------------------------
-- site_content (CMS)
-- ---------------------------------------------------------------------------
INSERT INTO public.site_content (key, value) VALUES
  (
    'home.hero',
    '{
      "title_before_ar": "سيارتك تستحق الأفضل،",
      "title_highlight_ar": "ونحن نقدّمه.",
      "subtitle_ar": "ودّع همّ الصيانة والانتظار — في Service Time نصل إليك في الرياض بفريق فني معتمد، سواء احتجت صيانة دورية، مساعدة طارئة، أو قطع غيار. اطلب الخدمة في دقائق، تابع طلبك لحظة بلحظة، واترك الباقي علينا — سرعة، شفافية، وخدمة تليق بسيارتك.",
      "cta_ar": "ابدأ الآن"
    }'::jsonb
  ),
  (
    'about.summary',
    '{
      "title_ar": "من نحن",
      "body_ar": "Service Time منصة سعودية لصيانة السيارات وطلب قطع الغيار مع تتبع مباشر للفني."
    }'::jsonb
  ),
  (
    'contact.phone',
    '{"value": "+966500000001", "label_ar": "الهاتف"}'::jsonb
  ),
  (
    'contact.email',
    '{"value": "info@servicetime.sa", "label_ar": "البريد"}'::jsonb
  ),
  (
    'contact.whatsapp',
    '{"value": "+966500000001", "label_ar": "واتساب"}'::jsonb
  ),
  (
    'locations.workshops',
    '{
      "branches": [
        {
          "id": "riyadh-north",
          "name_ar": "ورشة الشمال - الرياض",
          "address_ar": "حي النرجس، الرياض",
          "lat": 24.8167,
          "lng": 46.7219
        },
        {
          "id": "riyadh-south",
          "name_ar": "ورشة الجنوب - الرياض",
          "address_ar": "حي العزيزية، الرياض",
          "lat": 24.5720,
          "lng": 46.7890
        }
      ]
    }'::jsonb
  );

-- ---------------------------------------------------------------------------
-- services (catalogue)
-- ---------------------------------------------------------------------------
INSERT INTO public.services (
  id, name_ar, description_ar, category, service_type, is_active, sort_order
) VALUES
  (
    'a1000001-0001-4001-8001-000000000001',
    'صيانة دورية',
    'فحص شامل وتغيير الزيت والفلاتر',
    'صيانة',
    'periodic_maintenance',
    true,
    1
  ),
  (
    'a1000001-0001-4001-8001-000000000002',
    'تغيير الزيت',
    'تغيير زيت المحرك وفلتر الزيت',
    'صيانة',
    'periodic_maintenance',
    true,
    2
  ),
  (
    'a1000001-0001-4001-8001-000000000003',
    'فحص الفرامل',
    'فحص وصيانة نظام الفرامل',
    'صيانة',
    'periodic_maintenance',
    true,
    3
  ),
  (
    'a1000001-0001-4001-8001-000000000004',
    'خدمة طوارئ على الطريق',
    'إصلاح أعطال طارئة — بطارية، إطارات، تشغيل',
    'طوارئ',
    'emergency',
    true,
    4
  ),
  (
    'a1000001-0001-4001-8001-000000000005',
    'ورشة متنقلة',
    'فني يصل إلى موقعك في الرياض',
    'طوارئ',
    'emergency',
    true,
    5
  ),
  (
    'a1000001-0001-4001-8001-000000000006',
    'طلب قطع غيار',
    'اطلب قطعة غيار وسنتواصل معك للتأكيد',
    'قطع غيار',
    'spare_parts',
    true,
    6
  );

-- ---------------------------------------------------------------------------
-- spare_parts (catalogue)
-- ---------------------------------------------------------------------------
INSERT INTO public.spare_parts (
  id, name_ar, description_ar, category, details, img, is_active
) VALUES
  (
    'b2000002-0002-4002-8002-000000000001',
    'قرص فرامل',
    'قرص فرامل عالي الأداء — جودة OEM وبدائل معتمدة',
    'فرامل',
    'متوفر بمقاسات متعددة — يرجى ذكر موديل السيارة',
    '/spare-parts/disque-frein.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000002',
    'محور العجلة',
    'محور عجلة مع رولمان بلي — تركيب دقيق',
    'هيكل',
    'متوفر لمعظم موديلات السيارات',
    '/spare-parts/moyeu-roue.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000003',
    'قرص كلتش',
    'قرص كلتش بسطح احتكاك مقاوم للحرارة',
    'نقل الحركة',
    'يرجى ذكر نوع ناقل الحركة (يدوي / أوتوماتيك)',
    '/spare-parts/disque-embrayage.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000004',
    'مولد كهربائي',
    'Alternator — شحن البطارية وتشغيل الأنظمة الكهربائية',
    'كهرباء',
    'فحص وتركيب متاح في الورشة أو المتنقلة',
    '/spare-parts/alternateur.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000005',
    'مضخة ماء',
    'مضخة تبريد المحرك — أداء موثوق',
    'تبريد',
    'متوافقة مع أنظمة التبريد الحديثة',
    '/spare-parts/pompe-eau.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000006',
    'فلتر هواء',
    'فلتر هواء محرك — حماية فعالة من الغبار',
    'فلاتر',
    'يرجى ذكر سنة الصنع وموديل السيارة',
    '/spare-parts/filtre-air.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000007',
    'حاقنات وقود',
    'حاقنات وقود — رش دقيق واستهلاك محسّن',
    'وقود',
    'مجموعة أو قطعة فردية حسب الطلب',
    '/spare-parts/injecteurs.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000008',
    'ذراع تعليق',
    'ذراع تحكم أمامي — استقرار وقيادة آمنة',
    'تعليق',
    'يرجى ذكر رقم الشاسيه (VIN)',
    '/spare-parts/bras-suspension.png',
    true
  ),
  (
    'b2000002-0002-4002-8002-000000000009',
    'سير توقيت',
    'سير توقيت مع شداد — مجموعة كاملة',
    'نقل الحركة',
    'تركيب احترافي موصى به عند الاستبدال',
    '/spare-parts/courroie.png',
    true
  );

-- ---------------------------------------------------------------------------
-- service_requests (demandes démo)
-- tracking_token fixes pour tester la page de suivi
-- ---------------------------------------------------------------------------
INSERT INTO public.service_requests (
  id,
  customer_name,
  customer_phone,
  car_type,
  location_text,
  location_lat,
  location_lng,
  description,
  service_type,
  execution_method,
  status,
  priority,
  tracking_token,
  created_at
) VALUES
  (
    'c3000003-0003-4003-8003-000000000001',
    'أحمد العتيبي',
    '+966501234567',
    'تويota كامري 2020',
    'حي النرجس، الرياض',
    24.8167,
    46.7219,
    'تغيير زيت وفحص عام',
    'periodic_maintenance',
    'workshop_visit',
    'received',
    'normal',
    'demo-rec001',
    now() - interval '2 hours'
  ),
  (
    'c3000003-0003-4003-8003-000000000002',
    'سارة القحطاني',
    '+966509876543',
    'هyundai Tucson 2022',
    'طريق الملك فهد، الرياض',
    24.7136,
    46.6753,
    'بطارية ضعيفة — السيارة لا تعمل',
    'emergency',
    'mobile_workshop',
    'on_the_way',
    'high',
    'demo-track-live',
    now() - interval '45 minutes'
  ),
  (
    'c3000003-0003-4003-8003-000000000003',
    'محمد الشمري',
    '+966551112233',
    'نissan Patrol 2019',
    'حي العزيزية، الرياض',
    24.5720,
    46.7890,
    'طلب فلتر هواء + فلتر مكيف',
    'spare_parts',
    'workshop_visit',
    'completed',
    'low',
    'demo-done003',
    now() - interval '3 days'
  );

-- Timeline complète pour la demande "on_the_way" (suivi live)
INSERT INTO public.request_status_history (request_id, status, created_at)
VALUES
  (
    'c3000003-0003-4003-8003-000000000002',
    'received',
    now() - interval '45 minutes'
  ),
  (
    'c3000003-0003-4003-8003-000000000002',
    'in_progress',
    now() - interval '35 minutes'
  ),
  (
    'c3000003-0003-4003-8003-000000000002',
    'on_the_way',
    now() - interval '15 minutes'
  );

-- Timeline pour demande terminée
INSERT INTO public.request_status_history (request_id, status, created_at)
VALUES
  (
    'c3000003-0003-4003-8003-000000000003',
    'received',
    now() - interval '3 days'
  ),
  (
    'c3000003-0003-4003-8003-000000000003',
    'in_progress',
    now() - interval '3 days' + interval '2 hours'
  ),
  (
    'c3000003-0003-4003-8003-000000000003',
    'completed',
    now() - interval '2 days'
  );

-- ---------------------------------------------------------------------------
-- notifications_log (exemples)
-- ---------------------------------------------------------------------------
INSERT INTO public.notifications_log (
  request_id, channel, event, status, payload
) VALUES
  (
    'c3000003-0003-4003-8003-000000000001',
    'whatsapp',
    'order_created',
    'sent',
    '{"to": "+966501234567", "template": "order_confirmation"}'::jsonb
  ),
  (
    'c3000003-0003-4003-8003-000000000002',
    'sms',
    'status_updated',
    'sent',
    '{"to": "+966509876543", "status": "on_the_way"}'::jsonb
  );

-- ---------------------------------------------------------------------------
-- Note : profiles + auth.users
-- Les comptes admin/technicien se créent via Supabase Auth (Dashboard).
-- Après création d''un user, lier son profil :
--
-- INSERT INTO public.profiles (id, full_name, phone, role, technician_type)
-- VALUES (
--   '<auth-user-uuid>',
--   'فني متنقل',
--   '+966500000002',
--   'technician',
--   'mobile'
-- );
-- ---------------------------------------------------------------------------
