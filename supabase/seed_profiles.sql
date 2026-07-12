-- Service Time — Seed users (admin + techniciens + clients)
-- Exécuter dans Supabase SQL Editor (rôle postgres)
--   ou : npm run db:seed-profiles
--
-- Comptes :
--   admin@servicetime.sa      / Admin123!
--   tech@servicetime.sa       / Tech123!    (فني متنقل)
--   workshop@servicetime.sa   / Tech123!    (ورشة)
--   client@servicetime.sa     / Client123!  (عميل)
--   sara@servicetime.sa       / Client123!  (عميل)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid := 'e1000001-0001-4001-8001-000000000001';
  tech_mobile_id uuid := 'e1000001-0001-4001-8001-000000000002';
  tech_workshop_id uuid := 'e1000001-0001-4001-8001-000000000003';
  client_ahmed_id uuid := 'e1000001-0001-4001-8001-000000000004';
  client_sara_id uuid := 'e1000001-0001-4001-8001-000000000005';
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES
    (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@servicetime.sa',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"مدير النظام","full_name_ar":"مدير النظام","full_name_en":"System Admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      tech_mobile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'tech@servicetime.sa',
      crypt('Tech123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"فهد المتنقل","full_name_ar":"فهد المتنقل","full_name_en":"Fahd Mobile"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      tech_workshop_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'workshop@servicetime.sa',
      crypt('Tech123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"ورشة الجنوب","full_name_ar":"ورشة الجنوب","full_name_en":"South Workshop"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      client_ahmed_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'client@servicetime.sa',
      crypt('Client123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"أحمد العتيبي","full_name_ar":"أحمد العتيبي","full_name_en":"Ahmed Al-Otaibi"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      client_sara_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'sara@servicetime.sa',
      crypt('Client123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"سارة القحطاني","full_name_ar":"سارة القحطاني","full_name_en":"Sara Al-Qahtani"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@servicetime.sa'),
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    ),
    (
      tech_mobile_id,
      tech_mobile_id,
      jsonb_build_object('sub', tech_mobile_id::text, 'email', 'tech@servicetime.sa'),
      'email',
      tech_mobile_id::text,
      now(),
      now(),
      now()
    ),
    (
      tech_workshop_id,
      tech_workshop_id,
      jsonb_build_object('sub', tech_workshop_id::text, 'email', 'workshop@servicetime.sa'),
      'email',
      tech_workshop_id::text,
      now(),
      now(),
      now()
    ),
    (
      client_ahmed_id,
      client_ahmed_id,
      jsonb_build_object('sub', client_ahmed_id::text, 'email', 'client@servicetime.sa'),
      'email',
      client_ahmed_id::text,
      now(),
      now(),
      now()
    ),
    (
      client_sara_id,
      client_sara_id,
      jsonb_build_object('sub', client_sara_id::text, 'email', 'sara@servicetime.sa'),
      'email',
      client_sara_id::text,
      now(),
      now(),
      now()
    )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (
    id, full_name, full_name_ar, full_name_en, phone, role, technician_type, is_active
  )
  VALUES
    (admin_id, 'مدير النظام', 'مدير النظام', 'System Admin', '+966500000001', 'admin', NULL, true),
    (tech_mobile_id, 'فهد المتنقل', 'فهد المتنقل', 'Fahd Mobile', '+966500000002', 'technician', 'mobile', true),
    (tech_workshop_id, 'ورشة الجنوب', 'ورشة الجنوب', 'South Workshop', '+966500000003', 'technician', 'workshop', true),
    (client_ahmed_id, 'أحمد العتيبي', 'أحمد العتيبي', 'Ahmed Al-Otaibi', '+966501234567', 'client', NULL, true),
    (client_sara_id, 'سارة القحطاني', 'سارة القحطاني', 'Sara Al-Qahtani', '+966509876543', 'client', NULL, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    full_name_ar = EXCLUDED.full_name_ar,
    full_name_en = EXCLUDED.full_name_en,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    technician_type = EXCLUDED.technician_type,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  UPDATE public.service_requests
  SET client_id = client_ahmed_id
  WHERE tracking_token = 'demo-rec001';

  UPDATE public.service_requests
  SET
    client_id = client_sara_id,
    assigned_technician_id = tech_mobile_id
  WHERE tracking_token = 'demo-track-live';

  INSERT INTO public.technician_locations (technician_id, lat, lng, updated_at)
  VALUES (tech_mobile_id, 24.7050, 46.6700, now())
  ON CONFLICT (technician_id) DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    updated_at = now();

  INSERT INTO public.client_vehicles (client_id, label)
  VALUES
    (client_ahmed_id, 'تويوتا كامري 2020'),
    (client_ahmed_id, 'هيونداي توسان 2022'),
    (client_sara_id, 'هيونداي توسان 2022')
  ON CONFLICT DO NOTHING;

END $$;
