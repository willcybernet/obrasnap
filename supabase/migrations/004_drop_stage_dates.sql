-- Remove start_date and end_date columns from stages table
ALTER TABLE public.stages
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS end_date;