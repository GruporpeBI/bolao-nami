---
name: sofascore-world-cup-supabase
description: Install Supabase/Postgres logic for a live 2026 World Cup scoreboard that tracks Brazil matches plus World Cup semifinals and final, syncing match agenda daily and updating score and ball possession every 5 minutes from Sofascore-style football event APIs.
---

# Sofascore World Cup Supabase

Use this skill when installing the database, scheduled jobs, and ingestion code for a Supabase-backed 2026 World Cup scoreboard.

The product needs:

- Brazil's 2026 World Cup match agenda.
- Any Brazil knockout match if Brazil advances.
- Both World Cup semifinal matches.
- The World Cup final.
- Live updates every 5 minutes for score and ball possession.

## References

Read or use these references when implementing:

- Sofascore API community notes: https://github.com/apdmatos/sofascore-api/blob/main/sofascore-api.md
- Sofascore scraping discussion: https://stackoverflow.com/questions/77072151/scrape-sofascore-with-python-for-info-on-team-lineups-and-votes

Key points:

- Sofascore match pages are dynamic; do not rely on static HTML for live data.
- Community-documented base URL: `https://api.sofascore.com/api/v1`.
- Event IDs often appear in match URLs as `#id:{eventId}`.
- Sofascore may return `403`. Keep the fetch adapter replaceable and log failures clearly. Do not hardcode fragile bypasses.

Useful endpoints:

```text
GET /event/{eventId}
GET /event/{eventId}/statistics
GET /event/{eventId}/incidents
GET /sport/football/scheduled-events/{YYYY-MM-DD}
GET /unique-tournament/{tournamentId}/seasons
GET /unique-tournament/{tournamentId}/season/{seasonId}/events/round/{roundNumber}
```

## Confirmed Brazil Group Matches

Seed these matches if Sofascore discovery does not return them yet. Keep them updatable by `event_id` once discovered.

| Date | Match | Brasilia Time | Venue |
|---|---|---:|---|
| 2026-06-13 | Brazil vs Morocco | 19:00 | New York/New Jersey Stadium |
| 2026-06-19 | Brazil vs Haiti | 21:30 | Philadelphia Stadium |
| 2026-06-24 | Scotland vs Brazil | 19:00 | Miami Stadium |

Known IDs:

```text
Brazil team ID: 4748
World Cup unique tournament ID: 16
```

Do not assume Brazil qualifies for the knockout stage. Discover new Brazil matches daily.

## Data To Store

Store only what the website needs, plus source metadata for reliable syncing.

Live fields:

```text
home_score
away_score
home_possession
away_possession
```

Agenda fields:

```text
event_id
match_url
home_team_id
away_team_id
home_team_name
away_team_name
start_at
stage
round_name
round_number
status_type
status_description
is_brazil_match
is_semifinal
is_final
raw_event
```

Before kickoff, possession can be unavailable. Store `null`, not `0`.

## Supabase Migration

Inspect the existing schema first. Reuse existing match tables if they already exist. If no compatible tables exist, add this migration.

```sql
create table if not exists public.world_cup_matches (
  event_id bigint primary key,
  source text not null default 'sofascore',
  unique_tournament_id integer not null default 16,
  season_id bigint,
  match_url text,
  slug text,
  stage text,
  round_name text,
  round_number integer,
  status_type text,
  status_description text,
  start_at timestamptz,
  home_team_id bigint,
  away_team_id bigint,
  home_team_name text,
  away_team_name text,
  is_brazil_match boolean not null default false,
  is_semifinal boolean not null default false,
  is_final boolean not null default false,
  should_poll_live boolean generated always as (
    is_brazil_match or is_semifinal or is_final
  ) stored,
  raw_event jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_cup_live_stats (
  event_id bigint primary key references public.world_cup_matches(event_id) on delete cascade,
  home_score integer,
  away_score integer,
  home_possession integer,
  away_possession integer,
  status_type text,
  status_description text,
  raw_event jsonb not null default '{}'::jsonb,
  raw_statistics jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_cup_sync_runs (
  id bigserial primary key,
  job_name text not null,
  status text not null check (status in ('started', 'success', 'error')),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists world_cup_matches_start_at_idx
  on public.world_cup_matches (start_at);

create index if not exists world_cup_matches_poll_idx
  on public.world_cup_matches (should_poll_live, status_type, start_at);
```

Enable public read and service-role-only writes:

```sql
alter table public.world_cup_matches enable row level security;
alter table public.world_cup_live_stats enable row level security;

create policy "Public can read World Cup matches"
on public.world_cup_matches
for select
to anon, authenticated
using (true);

create policy "Public can read World Cup live stats"
on public.world_cup_live_stats
for select
to anon, authenticated
using (true);
```

Do not create public insert, update, or delete policies.

## Public Read View

Create a simple view for the frontend:

```sql
create or replace view public.world_cup_scoreboard as
select
  m.event_id,
  m.match_url,
  m.start_at,
  m.stage,
  m.round_name,
  m.home_team_name,
  m.away_team_name,
  m.is_brazil_match,
  m.is_semifinal,
  m.is_final,
  coalesce(s.status_type, m.status_type) as status_type,
  coalesce(s.status_description, m.status_description) as status_description,
  s.home_score,
  s.away_score,
  s.home_possession,
  s.away_possession,
  s.fetched_at as live_fetched_at
from public.world_cup_matches m
left join public.world_cup_live_stats s on s.event_id = m.event_id
where m.should_poll_live = true;
```

## Agenda Sync Job

Create a server-side job named `sync-world-cup-agenda`.

Schedule:

```text
daily at 03:00 UTC
```

Purpose:

- Discover all Brazil World Cup matches.
- Discover semifinal and final matches.
- Upsert rows into `world_cup_matches`.
- Keep agenda fresh when Brazil advances.

Discovery strategy:

1. Resolve 2026 World Cup season using `GET /unique-tournament/16/seasons`.
2. Scan scheduled football events by date during the tournament window.
3. Use this default window unless the app stores official tournament dates:
   - `2026-06-01` through `2026-07-31`
4. Filter World Cup events by `uniqueTournament.id === 16`.
5. Keep events where Brazil is home or away, or the round is semifinal, or the round is final.
6. Upsert by `event_id`.

Filtering helpers:

```ts
const BRAZIL_TEAM_ID = 4748;
const WORLD_CUP_UNIQUE_TOURNAMENT_ID = 16;

function isBrazilMatch(event) {
  return event.homeTeam?.id === BRAZIL_TEAM_ID || event.awayTeam?.id === BRAZIL_TEAM_ID;
}

function roundText(event) {
  return [
    event.roundInfo?.name,
    event.roundInfo?.slug,
    event.tournament?.name,
    event.tournament?.slug
  ].filter(Boolean).join(' ').toLowerCase();
}

function isSemifinal(event) {
  const text = roundText(event);
  return text.includes('semi') || text.includes('semifinal');
}

function isFinal(event) {
  const text = roundText(event);
  return text.includes('final') && !text.includes('third') && !text.includes('3rd');
}
```

## Live Polling Job

Create a server-side job named `poll-world-cup-live-stats`.

Schedule:

```text
every 5 minutes
```

Select matches:

```sql
select event_id
from public.world_cup_matches
where should_poll_live = true
  and start_at >= now() - interval '4 hours'
  and start_at <= now() + interval '30 minutes'
  and coalesce(status_type, '') not in ('finished', 'canceled', 'postponed')
order by start_at asc;
```

For each match:

1. Fetch `GET /event/{eventId}`.
2. Fetch `GET /event/{eventId}/statistics`.
3. Extract score from:
   - `event.homeScore.current`
   - `event.awayScore.current`
4. Extract possession from `statistics`.
5. Upsert `world_cup_live_stats`.
6. Update status fields in `world_cup_matches`.
7. Log success or error in `world_cup_sync_runs`.

Possession parser:

```ts
function parsePercent(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function findPossession(statisticsPayload) {
  for (const period of statisticsPayload.statistics ?? []) {
    for (const group of period.groups ?? []) {
      for (const item of group.statisticsItems ?? []) {
        const key = String(item.key ?? item.name ?? '').toLowerCase();
        if (key.includes('possession') || key.includes('posse')) {
          return {
            home_possession: parsePercent(item.home),
            away_possession: parsePercent(item.away)
          };
        }
      }
    }
  }

  return {
    home_possession: null,
    away_possession: null
  };
}
```

## Supabase Edge Function Pattern

Prefer Supabase Edge Functions unless the project already has a backend worker.

Required secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SOFASCORE_BASE_URL=https://api.sofascore.com/api/v1
```

Fetch helper:

```ts
async function sofascoreGet(path: string) {
  const baseUrl = Deno.env.get('SOFASCORE_BASE_URL') ?? 'https://api.sofascore.com/api/v1';
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0',
      referer: 'https://www.sofascore.com/'
    }
  });

  if (!response.ok) {
    throw new Error(`Sofascore ${response.status} for ${path}`);
  }

  return response.json();
}
```

Use `SUPABASE_SERVICE_ROLE_KEY` only inside Edge Functions or trusted backend jobs. Never expose it in frontend code.

## Scheduler Options

Use the project's existing scheduler if present. Otherwise choose one:

- Supabase Scheduled Edge Functions.
- `pg_cron` plus `pg_net` calling Edge Functions.
- Existing backend cron or queue worker.

Recommended schedules:

```text
sync-world-cup-agenda: daily at 03:00 UTC
poll-world-cup-live-stats: every 5 minutes
```

## Validation Checklist

Verify before shipping:

- Migrations run on local and remote Supabase.
- RLS allows public reads but blocks public writes.
- Agenda sync is idempotent.
- Brazil group matches appear even before live event IDs are discovered.
- New Brazil knockout matches are discovered if Brazil advances.
- Semifinals and final are included.
- Polling updates score and possession every 5 minutes for active matches.
- Possession remains `null` before stats exist.
- Finished/canceled/postponed matches stop polling.
- `403`, timeout, and missing-statistics errors are logged.

## Deliverables

When using this skill, Claude Code should produce:

- Supabase migration SQL.
- Agenda sync Edge Function or backend job.
- Live polling Edge Function or backend job.
- Scheduler configuration.
- Required Supabase secrets.
- Minimal frontend query using `world_cup_scoreboard`.
