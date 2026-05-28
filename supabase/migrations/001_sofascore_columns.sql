-- Add sofascore columns to existing games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS sofascore_id bigint,
  ADD COLUMN IF NOT EXISTS sofascore_url text,
  ADD COLUMN IF NOT EXISTS status_type text,
  ADD COLUMN IF NOT EXISTS status_description text;

CREATE UNIQUE INDEX IF NOT EXISTS games_sofascore_id_idx
  ON public.games (sofascore_id)
  WHERE sofascore_id IS NOT NULL;

-- Sync run audit log
CREATE TABLE IF NOT EXISTS public.world_cup_sync_runs (
  id bigserial PRIMARY KEY,
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'success', 'error')),
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
