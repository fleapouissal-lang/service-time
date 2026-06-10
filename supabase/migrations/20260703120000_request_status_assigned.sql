-- Add "assigned" between received and in_progress (technician assigned, not started yet).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    INNER JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'request_status'
      AND e.enumlabel = 'assigned'
  ) THEN
    ALTER TYPE public.request_status ADD VALUE 'assigned';
  END IF;
END
$$;
