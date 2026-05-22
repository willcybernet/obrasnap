-- Migration: Adicionar campo cover_image_url à tabela projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
