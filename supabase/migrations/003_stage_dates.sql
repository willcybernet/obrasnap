-- Adiciona datas de início e fim previsto para cada etapa
ALTER TABLE public.stages
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;
