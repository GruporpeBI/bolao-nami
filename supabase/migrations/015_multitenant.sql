-- Migration 015: Multi-tenant (banco compartilhado)
-- =====================================================================
-- Aditiva e retrocompatível: o código já no ar ignora as colunas novas.
-- O site original vira o tenant 'amauri' (DEFAULT) — os dados existentes
-- (3 usuários, 1 torneio, 3 scores) recebem tenant_id='amauri' pelo DEFAULT.
-- games/match_latest/match_snapshots ficam SEM tenant_id (compartilhados).
-- =====================================================================

-- 1. Tabela de tenants + seed
CREATE TABLE IF NOT EXISTS public.tenants (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.tenants (id, name) VALUES
  ('amauri',          'Mercearia Amauri'),
  ('bambam',          'Bam Bam Café'),
  ('nami',            'Nami'),
  ('merceariacampos', 'Mercearia Campos')
ON CONFLICT (id) DO NOTHING;

-- 2. Coluna tenant_id (DEFAULT 'amauri' → backfill seguro dos dados atuais)
ALTER TABLE public.users                  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';
ALTER TABLE public.predictions            ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';
ALTER TABLE public.attendances            ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';
ALTER TABLE public.tournament_predictions ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';
ALTER TABLE public.scores                 ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';
ALTER TABLE public.app_config             ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'amauri';

-- 3. Índices por tenant (consultas filtram por tenant_id)
CREATE INDEX IF NOT EXISTS users_tenant_idx                  ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS predictions_tenant_idx            ON public.predictions(tenant_id);
CREATE INDEX IF NOT EXISTS attendances_tenant_idx            ON public.attendances(tenant_id);
CREATE INDEX IF NOT EXISTS tournament_predictions_tenant_idx ON public.tournament_predictions(tenant_id);
CREATE INDEX IF NOT EXISTS scores_tenant_idx                 ON public.scores(tenant_id);

-- 4. Uniques compostas (para 1 tenant é equivalente ao que já existe → não quebra)
--    users.cpf (unique) -> (tenant_id, cpf)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_cpf_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tenant_cpf_key;
ALTER TABLE public.users ADD  CONSTRAINT users_tenant_cpf_key UNIQUE (tenant_id, cpf);

--    app_config: PK (key) -> PK (tenant_id, key)
ALTER TABLE public.app_config DROP CONSTRAINT IF EXISTS app_config_pkey;
ALTER TABLE public.app_config ADD  CONSTRAINT app_config_pkey PRIMARY KEY (tenant_id, key);

-- Observação: predictions(user_id,game_id), attendances(user_id,game_id),
-- scores(user_id PK), tournament_predictions(user_id) já são seguras
-- porque user_id pertence a um único tenant. O tenant_id entra para filtro/índice.
