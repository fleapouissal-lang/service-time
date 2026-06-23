-- Optional original price: when higher than price, product shows as on promotion.
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS original_price numeric(10, 2);

COMMENT ON COLUMN public.spare_parts.original_price IS
  'Original price before discount (SAR). Shown struck-through when greater than price.';

-- Sample promotions (~10% off) for catalogue variety
UPDATE public.spare_parts
SET original_price = ROUND(price / 0.9, 2)
WHERE id IN (
  'b2000002-0002-4002-8002-000000000001',
  'b2000002-0002-4002-8002-000000000004',
  'b2000002-0002-4002-8002-000000000006',
  'b2000002-0002-4002-8002-000000000009'
)
AND (original_price IS NULL OR original_price <= price);
