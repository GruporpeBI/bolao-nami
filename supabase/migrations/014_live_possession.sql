-- Migration 014: Posse de bola AO VIVO (informativa), separada da oficial
-- =====================================================================
-- ball_possession_home  = posse OFICIAL, gravada só no FT (conta no desempate).
-- live_possession_home  = posse AO VIVO informativa, atualizada a cada poll
--                         durante o jogo (não conta na pontuação).
-- =====================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS live_possession_home integer;

COMMENT ON COLUMN public.games.live_possession_home IS
  'Posse do mandante AO VIVO (informativa, atualizada durante o jogo). A oficial é ball_possession_home, fixada no FT.';
