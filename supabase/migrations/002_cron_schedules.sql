-- Enable pg_cron and pg_net extensions (run in dashboard if not enabled)
-- These must be enabled in the Supabase dashboard under Database > Extensions
-- before this migration can succeed.

-- Schedule sync-agenda daily at 03:00 UTC
SELECT cron.schedule(
  'sync-world-cup-agenda',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/sync-agenda',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule poll-live every 5 minutes
SELECT cron.schedule(
  'poll-world-cup-live',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://yzbsahubleskqbfmvmei.supabase.co/functions/v1/poll-live',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
