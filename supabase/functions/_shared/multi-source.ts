/**
 * Shared multi-source polling helpers.
 * Used by poll-thesportsdb and poll-espn Edge Functions.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAf } from "./apifootball.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActiveGame {
  id: string;
  sofascore_id: number;
  home_team: string;
  away_team: string;
  thesportsdb_event_id: string | null;
  espn_event_id: string | null;
  espn_league: string | null;
  api_football_fixture_id: string | null;
}

export interface MatchLatestSource {
  event_id: number;
  tdb_home_score: number | null;
  tdb_away_score: number | null;
  tdb_status: string | null;
  espn_home_score: number | null;
  espn_away_score: number | null;
  espn_possession: number | null;
  espn_status: string | null;
  consensus_status: string;
  final_confirmed: boolean;
}

// ---------------------------------------------------------------------------
// Active game query
// ---------------------------------------------------------------------------

export async function findActiveGame(
  supabase: ReturnType<typeof createClient>
): Promise<ActiveGame | null> {
  const windowStart = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const windowEnd   = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, sofascore_id, home_team, away_team, thesportsdb_event_id, espn_event_id, espn_league, api_football_fixture_id"
    )
    .eq("is_enabled", true)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .order("scheduled_at")
    .limit(1)
    .maybeSingle();

  if (error) console.error("[multi-source] findActiveGame error:", error.message);
  return data ?? null;
}

// ---------------------------------------------------------------------------
// match_latest helpers
// ---------------------------------------------------------------------------

export async function getMatchLatest(
  supabase: ReturnType<typeof createClient>,
  eventId: number
): Promise<MatchLatestSource | null> {
  const { data } = await supabase
    .from("match_latest")
    .select(
      "event_id, tdb_home_score, tdb_away_score, tdb_status, espn_home_score, espn_away_score, espn_possession, espn_status, consensus_status, final_confirmed"
    )
    .eq("event_id", eventId)
    .maybeSingle();
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Notify Next.js app via /api/sync-result
// ---------------------------------------------------------------------------

export async function notifyApp(
  appUrl: string,
  syncSecret: string,
  game: ActiveGame,
  homeScore: number | null,
  awayScore: number | null,
  possession: number | null
): Promise<void> {
  const url = `${appUrl.replace(/\/$/, "")}/api/sync-result`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify({
        event_id: game.sofascore_id,
        home_score: homeScore,
        away_score: awayScore,
        home_possession: possession,
      }),
    });
    if (!res.ok) console.warn(`[multi-source] sync-result HTTP ${res.status}`);
    else         console.log(`[multi-source] sync-result OK para sofascore_id=${game.sofascore_id}`);
  } catch (err) {
    console.error("[multi-source] sync-result fetch error:", err);
  }
}

// ---------------------------------------------------------------------------
// FT detection helpers
// ---------------------------------------------------------------------------

// Tokens curtos: match EXATO (evita falso positivo — ex.: "Halftime" contém "ft").
const FINISHED_EXACT   = ["ft", "aet", "pen", "fin", "final", "finished"];
// Frases que só ocorrem com o jogo encerrado: match por substring é seguro.
const FINISHED_PHRASES = ["full time", "full-time", "match finished", "after extra time", "after penalties", "awarded", "ended"];

export function isFinishedStatus(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  if (FINISHED_EXACT.includes(s)) return true;
  return FINISHED_PHRASES.some((f) => s.includes(f));
}

// ---------------------------------------------------------------------------
// Posse via API-Football (fallback de posse no FT quando ESPN não traz)
// ---------------------------------------------------------------------------

async function fetchAfPossession(fixtureId: string): Promise<number | null> {
  try {
    const base = "https://v3.football.api-sports.io";
    const stRes = await fetchAf(`${base}/fixtures/statistics?fixture=${fixtureId}`).then((r) => r.json());
    const homeStats = (stRes.response?.[0]?.statistics ?? []) as Array<{ type: string; value: string }>;
    const possEntry = homeStats.find((s) => s.type === "Ball Possession");
    const afPoss    = possEntry?.value ? parseFloat(possEntry.value.replace("%", "")) : null;
    // Posse válida = 1–99; 0/100/null = sem dado
    return afPoss != null && afPoss > 0 && afPoss < 100 ? Math.round(afPoss) : null;
  } catch (err) {
    console.error("[compare] fetchAfPossession falhou:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// compareAndFinalize — consensus logic
// ---------------------------------------------------------------------------

export async function compareAndFinalize(
  supabase: ReturnType<typeof createClient>,
  game: ActiveGame,
  eventId: number
): Promise<"agreed" | "conflict" | "confirmed" | "manual_needed"> {
  const ml = await getMatchLatest(supabase, eventId);
  if (!ml) return "manual_needed";

  // Skip if already confirmed
  if (ml.final_confirmed) return "confirmed";

  const tdbHome  = ml.tdb_home_score;
  const tdbAway  = ml.tdb_away_score;
  const espnHome = ml.espn_home_score;
  const espnAway = ml.espn_away_score;

  const bothPresent = tdbHome != null && espnHome != null;
  const agree =
    bothPresent && tdbHome === espnHome && tdbAway === espnAway;

  const appUrl     = Deno.env.get("APP_URL") ?? "";
  const syncSecret = Deno.env.get("SYNC_SECRET") ?? "";

  // home_possession é coluna INTEGER → arredondar. Posse válida = 1–99 (0/100 = sem dado).
  const espnPossValid = ml.espn_possession != null && ml.espn_possession > 0 && ml.espn_possession < 100
    ? Math.round(ml.espn_possession) : null;

  if (agree) {
    // Posse no FT: ESPN (a "outra" fonte já foi consultada via ad-hoc) → senão API-Football.
    // Se nenhuma trouxer posse, fica null → admin exibe "falha de API posse de bola".
    let finalPoss = espnPossValid;
    if (finalPoss == null && game.api_football_fixture_id) {
      finalPoss = await fetchAfPossession(game.api_football_fixture_id);
    }

    await supabase
      .from("match_latest")
      .update({
        home_score:      espnHome,
        away_score:      espnAway,
        home_possession: finalPoss,
        consensus_status: finalPoss == null ? "agreed_sem_posse" : "agreed",
        final_confirmed:  true,
        updated_at:       new Date().toISOString(),
      })
      .eq("event_id", eventId);

    await notifyApp(appUrl, syncSecret, game, espnHome, espnAway, finalPoss);
    console.log(`[compare] agreed: ${espnHome}-${espnAway} poss=${finalPoss ?? "sem dado"}`);
    return "agreed";
  }

  // Desacordo ou dado faltando → API-Football como árbitro (dual-key automático)
  if (game.api_football_fixture_id) {
    try {
      const base = "https://v3.football.api-sports.io";
      const [fixRes, stRes] = await Promise.all([
        fetchAf(`${base}/fixtures?id=${game.api_football_fixture_id}`).then((r) => r.json()),
        fetchAf(`${base}/fixtures/statistics?fixture=${game.api_football_fixture_id}`).then((r) => r.json()),
      ]);

      const fix = fixRes.response?.[0];
      if (!fix) throw new Error("AF: sem fixture");

      const afHome = fix.goals.home   as number | null;
      const afAway = fix.goals.away   as number | null;
      const homeStats = (stRes.response?.[0]?.statistics ?? []) as Array<{ type: string; value: string }>;
      const possEntry = homeStats.find((s) => s.type === "Ball Possession");
      const afPoss    = possEntry?.value
        ? parseFloat(possEntry.value.replace("%", ""))
        : null;
      // home_possession é INTEGER → arredondar; posse válida = 1–99 (0/100 = sem dado)
      const afPossInt = afPoss != null && afPoss > 0 && afPoss < 100 ? Math.round(afPoss) : null;

      const now = new Date().toISOString();
      await supabase
        .from("match_latest")
        .update({
          home_score:      afHome,
          away_score:      afAway,
          home_possession: afPossInt,
          af_home_score:   afHome,
          af_away_score:   afAway,
          af_possession:   afPoss,
          af_status:       fix.fixture.status.short,
          af_fetched_at:   now,
          consensus_status: bothPresent ? "conflict" : "confirmed",
          final_confirmed:  true,
          updated_at:       now,
        })
        .eq("event_id", eventId);

      await notifyApp(appUrl, syncSecret, game, afHome, afAway, afPossInt);
      console.log(`[compare] AF árbitro: ${afHome}-${afAway}`);
      return bothPresent ? "conflict" : "confirmed";
    } catch (err) {
      console.error("[compare] API-Football falhou:", err);
    }
  }

  // Tudo falhou → manual
  await supabase
    .from("match_latest")
    .update({ consensus_status: "manual_needed" })
    .eq("event_id", eventId);

  console.warn(`[compare] manual_needed para sofascore_id=${game.sofascore_id}`);
  return "manual_needed";
}
