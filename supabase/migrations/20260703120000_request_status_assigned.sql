-- Add "assigned" step between received and in_progress (technician assigned, not started yet).
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'assigned' AFTER 'received';
