create table if not exists match_latest (
  event_id bigint primary key,
  source text not null default 'sofascore',
  match_url text not null,
  home_team text,
  away_team text,
  status text,
  home_score integer,
  away_score integer,
  home_possession integer,
  away_possession integer,
  goals jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists match_snapshots (
  id bigserial primary key,
  event_id bigint not null,
  source text not null default 'sofascore',
  match_url text not null,
  status text,
  home_score integer,
  away_score integer,
  home_possession integer,
  away_possession integer,
  goals jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

create index if not exists match_snapshots_event_fetched_idx
  on match_snapshots (event_id, fetched_at desc);
