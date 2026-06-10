-- ============================================================================
-- ATIVAR POLLING AUTOMATICO PARA TODOS OS JOGOS
-- ============================================================================
-- Execute isso no Supabase SQL Editor para ativar polling automático
-- ============================================================================

-- Cria pg_cron job que dispara polling a cada minuto
-- Este job verifica todos os jogos ativos (scheduled_at <= now) e dispara polling
DO $$
BEGIN
  -- Remove job anterior se existir
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-polling-all-games') THEN
    PERFORM cron.unschedule('auto-polling-all-games');
  END IF;
END $$;

-- Cria novo job: verifica a cada 1 minuto se há jogos para fazer polling
SELECT cron.schedule(
  'auto-polling-all-games',
  '* * * * *',  -- A cada minuto
  $$
    SELECT net.http_post(
      url := 'https://bolao-amauri.vercel.app/api/admin/trigger-polling',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', 'bolao_sync_2026'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Verifica que o job foi criado
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'auto-polling-all-games';

-- ============================================================================
-- ALTERNATIVA: Usar Edge Function (se quiser manter tudo no Supabase)
-- ============================================================================
-- Descomente abaixo se preferir chamar uma Edge Function em vez de HTTP:

/*
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-polling-all-games') THEN
    PERFORM cron.unschedule('auto-polling-all-games');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-polling-all-games',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/game-start-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
*/
