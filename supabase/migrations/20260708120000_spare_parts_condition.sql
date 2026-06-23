-- Product condition: new or used (pre-owned)
CREATE TYPE public.spare_part_condition AS ENUM ('new', 'used');

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS part_condition public.spare_part_condition NOT NULL DEFAULT 'new';

COMMENT ON COLUMN public.spare_parts.part_condition IS
  'Product condition: new (OEM/new) or used (pre-owned / already used).';

CREATE INDEX IF NOT EXISTS spare_parts_condition_idx
  ON public.spare_parts (part_condition)
  WHERE is_active = true;

-- Seed variety: mark some catalogue items as used
UPDATE public.spare_parts
SET part_condition = 'used'
WHERE id IN (
  'b2000002-0002-4002-8002-000000000003',
  'b2000002-0002-4002-8002-000000000006',
  'b2000002-0002-4002-8002-000000000008'
);
