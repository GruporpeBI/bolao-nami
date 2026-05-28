ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS ranking_visible boolean NOT NULL DEFAULT false;
