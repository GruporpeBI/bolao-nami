/**
 * POST /api/admin/enrich-ids
 *
 * Auto-discovers thesportsdb_event_id, espn_event_id, espn_league and
 * api_football_fixture_id for all games that are missing any of those IDs.
 *
 * Sources queried:
 *   1. TheSportsDB   → /eventsseason.php?id=4429&s=2026 (Copa 2026)
 *                    + /eventsnextleague.php?id=4429 (suplementa idAPIfootball)
 *   2. ESPN          → /scoreboard?limit=200&dates=20260611-20260719 (fifa.world)
 *
 * Note: API-Football liga 1 (World Cup) requer plano pago para season 2026,
 * portanto não é usado para enriquecer fixture IDs.
 *
 * Team name matching uses a normalizer to handle aliases like
 * "United States" ↔ "USA", "Republic of Korea" ↔ "South Korea", etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_access")) return true;
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;
  return false;
}

// ---------------------------------------------------------------------------
// DB client (service role)
// ---------------------------------------------------------------------------

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Note: API-Football não é usado para Copa 2026 (requer plano pago)
// Mantém fallback de dados via TheSportsDB + ESPN
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Team name normalizer — handles common aliases between sources
// ---------------------------------------------------------------------------

const ALIASES: Record<string, string> = {
  "united states":   "usa",
  "u.s.a.":          "usa",
  "us":              "usa",
  "republic of korea": "south korea",
  "korea republic":  "south korea",
  "czech republic":  "czechia",
  "ir iran":         "iran",
  "chinese taipei":  "taiwan",
  "côte d'ivoire":   "ivory coast",
  "cote d'ivoire":   "ivory coast",
  "bosnia & herzegovina": "bosnia and herzegovina",
  "trinidadtobago":  "trinidad and tobago",
  "trinidad & tobago": "trinidad and tobago",
};

function normalize(name: string): string {
  const s = name.toLowerCase().trim().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  return ALIASES[s] ?? s;
}

function teamsMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function datesMatch(d1: string, d2: string): boolean {
  return d1.slice(0, 10) === d2.slice(0, 10);
}


// ---------------------------------------------------------------------------
// Source: ESPN — WC 2026 scoreboard (all games in one call)
// ---------------------------------------------------------------------------

interface EspnEvent {
  id: string;
  competitions: Array<{
    date: string;
    competitors: Array<{ homeAway: string; team: { displayName: string } }>;
  }>;
}

async function loadEspnEvents(): Promise<EspnEvent[]> {
  // WC 2026: June 11 – July 19, 2026
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[enrich-ids] ESPN scoreboard HTTP ${res.status}`);
      return [];
    }
    const data = await res.json() as { events: EspnEvent[] };
    return data.events ?? [];
  } catch (err) {
    console.warn("[enrich-ids] ESPN fetch error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Source: TheSportsDB — WC season events (league 4429 = FIFA World Cup 2026)
// ---------------------------------------------------------------------------

interface TdbEvent {
  idEvent:        string;
  strHomeTeam:    string;
  strAwayTeam:    string;
  dateEvent:      string; // YYYY-MM-DD
  strLeague:      string;
  idAPIfootball?: string | number; // ID da API-Football já incluído no TDB
}

async function loadTdbEvents(): Promise<TdbEvent[]> {
  // FIFA World Cup 2026 (league 4429, season 2026)
  const urlPrimary = "https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4429&s=2026";
  const urlSupplement = "https://www.thesportsdb.com/api/v1/json/123/eventsnextleague.php?id=4429";

  try {
    // Carrega eventsseason.php para obter todos os eventos da season
    let events: TdbEvent[] = [];
    const resPrimary = await fetch(urlPrimary, { headers: { Accept: "application/json" } });
    if (resPrimary.ok) {
      const data = await resPrimary.json() as { events: TdbEvent[] | null };
      events = data.events ?? [];
      console.log(`[enrich-ids] TDB season loaded: ${events.length} events`);
    } else {
      console.warn(`[enrich-ids] TDB season HTTP ${resPrimary.status}`);
    }

    // Suplementa com eventsnextleague.php que traz idAPIfootball
    if (events.length > 0) {
      try {
        const resSupplement = await fetch(urlSupplement, { headers: { Accept: "application/json" } });
        if (resSupplement.ok) {
          const dataSupplement = await resSupplement.json() as { events: TdbEvent[] | null };
          const supplementEvents = dataSupplement.events ?? [];

          // Mescla: insere idAPIfootball dos supplementEvents nos events principais
          for (const suppEvent of supplementEvents) {
            const idx = events.findIndex(e => e.idEvent === suppEvent.idEvent);
            if (idx >= 0 && suppEvent.idAPIfootball) {
              events[idx].idAPIfootball = suppEvent.idAPIfootball;
            }
          }
          console.log(`[enrich-ids] TDB eventsnextleague merged: ${supplementEvents.length} with idAPIfootball`);
        }
      } catch (err) {
        console.warn("[enrich-ids] TDB supplement fetch error:", err);
      }
    }

    return events;
  } catch (err) {
    console.warn("[enrich-ids] TDB fetch error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

function findEspnEvent(game: GameRow, events: EspnEvent[]): EspnEvent | undefined {
  return events.find((e) => {
    const comp = e.competitions?.[0];
    if (!comp) return false;
    if (!datesMatch(game.scheduled_at, comp.date)) return false;
    const home = comp.competitors?.find((c) => c.homeAway === "home")?.team.displayName ?? "";
    const away = comp.competitors?.find((c) => c.homeAway === "away")?.team.displayName ?? "";
    return (
      (teamsMatch(game.home_team, home) && teamsMatch(game.away_team, away)) ||
      (teamsMatch(game.home_team, away) && teamsMatch(game.away_team, home))
    );
  });
}

function findTdbEvent(game: GameRow, events: TdbEvent[]): TdbEvent | undefined {
  return events.find((e) =>
    datesMatch(game.scheduled_at, e.dateEvent) &&
    (
      (teamsMatch(game.home_team, e.strHomeTeam) && teamsMatch(game.away_team, e.strAwayTeam)) ||
      (teamsMatch(game.home_team, e.strAwayTeam) && teamsMatch(game.away_team, e.strHomeTeam))
    )
  );
}

// ---------------------------------------------------------------------------
// Game row type
// ---------------------------------------------------------------------------

interface GameRow {
  id: string;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  sofascore_id: number | null;
  thesportsdb_event_id: string | null;
  espn_event_id: string | null;
  espn_league: string | null;
  api_football_fixture_id: string | null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Fetch games that are missing at least one external ID
  const { data: gamesData, error: dbError } = await db
    .from("games")
    .select(
      "id, home_team, away_team, scheduled_at, sofascore_id, thesportsdb_event_id, espn_event_id, espn_league, api_football_fixture_id"
    )
    .or(
      "thesportsdb_event_id.is.null,espn_event_id.is.null,api_football_fixture_id.is.null"
    )
    .neq("home_team", "A definir")  // skip games with unknown teams
    .neq("away_team", "A definir")
    .order("scheduled_at");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const games = (gamesData ?? []) as GameRow[];
  if (games.length === 0) {
    return NextResponse.json({ ok: true, message: "Todos os IDs já estão preenchidos.", updated: 0 });
  }

  // Load all fixtures/events from each source in parallel
  const [espnEvents, tdbEvents] = await Promise.all([
    loadEspnEvents(),
    loadTdbEvents(),
  ]);

  console.log(`[enrich-ids] sources: ESPN=${espnEvents.length} TDB=${tdbEvents.length}`);

  let updated = 0;
  const results: Array<{ game: string; espn: boolean; tdb: boolean }> = [];

  for (const game of games) {
    const patch: Partial<GameRow> = {};

    // ESPN
    if (!game.espn_event_id) {
      const espn = findEspnEvent(game, espnEvents);
      if (espn) {
        patch.espn_event_id = espn.id;
        patch.espn_league   = "fifa.world";
      }
    }

    // TheSportsDB — extrai thesportsdb_event_id e idAPIfootball
    if (!game.thesportsdb_event_id) {
      const tdb = findTdbEvent(game, tdbEvents);
      if (tdb) {
        patch.thesportsdb_event_id = tdb.idEvent;
        // Se TDB tem o ID de API-Football, usa direto
        if (!game.api_football_fixture_id && tdb.idAPIfootball) {
          patch.api_football_fixture_id = String(tdb.idAPIfootball);
        }
      }
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from("games").update(patch as never).eq("id", game.id);
      if (!error) {
        updated++;
        results.push({
          game: `${game.home_team} × ${game.away_team}`,
          espn: "espn_event_id" in patch,
          tdb:  "thesportsdb_event_id" in patch,
        });
      } else {
        console.error(`[enrich-ids] update error for game ${game.id}:`, error.message);
      }
    }
  }

  return NextResponse.json({
    ok:        true,
    scanned:   games.length,
    updated,
    sources:   { espn: espnEvents.length, tdb: tdbEvents.length },
    results,
  });
}
