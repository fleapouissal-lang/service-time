-- Bilingual CMS content (workshops, hero, about) for existing databases

UPDATE public.site_content
SET value = '{
  "branches": [
    {
      "id": "riyadh-north",
      "name_ar": "ورشة الشمال - الرياض",
      "name_en": "North Workshop - Riyadh",
      "address_ar": "حي النرجس، الرياض",
      "address_en": "Al Narjis District, Riyadh",
      "lat": 24.8167,
      "lng": 46.7219
    },
    {
      "id": "riyadh-south",
      "name_ar": "ورشة الجنوب - الرياض",
      "name_en": "South Workshop - Riyadh",
      "address_ar": "حي العزيزية، الرياض",
      "address_en": "Al Aziziyah District, Riyadh",
      "lat": 24.5720,
      "lng": 46.7890
    }
  ]
}'::jsonb
WHERE key = 'locations.workshops';

UPDATE public.site_content
SET value = value
  || '{
    "title_before_en": "Your car deserves the best,",
    "title_highlight_en": "and we deliver it.",
    "subtitle_en": "Forget the hassle of maintenance and waiting — at Service Time we come to you in Riyadh with a certified technical team, whether you need periodic maintenance, emergency help, or spare parts. Request service in minutes, track your order in real time, and leave the rest to us.",
    "cta_en": "Get started"
  }'::jsonb
WHERE key = 'home.hero'
  AND NOT (value ? 'title_before_en');

UPDATE public.site_content
SET value = value
  || '{
    "title_en": "About us",
    "body_en": "Service Time is a Saudi platform for car maintenance and spare parts orders with live technician tracking."
  }'::jsonb
WHERE key = 'about.summary'
  AND NOT (value ? 'title_en');
