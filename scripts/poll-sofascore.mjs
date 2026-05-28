/**
 * poll-sofascore.mjs
 *
 * Roda a cada 5 minutos via GitHub Actions.
 * Busca jogos ativos com sofascore_id, atualiza placar e posse de bola,
 * e notifica o app quando um jogo termina para recalcular scores.
 *
 * Requer variáveis de ambiente:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   APP_URL          (ex: https://bolao-amauri.vercel.app)
 *   SYNC_SECRET      (ex: bolao_sync_2026)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL      = process.env.APP_URL ?? "";
const SYNC_SECRET  = process.env.SYNC_SECRET ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
const SOFASCORE_HEADERS = {
  "accept": "application/json, text/plain, */*",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
  "referer": "https://www.sofascore.com/",
  "origin": "https://www.sofascore.com",
};

async function sofascoreGet(path) {
  const res = await fetch(`${SOFASCORE_BASE}${path}`, { headers: SOFASCORE_HEADERS });
  if (!res.ok) throw new Error(`Sofascore HTTP ${res.status} for ${path}`);
  return res.json();
}

function parsePercent(value) {
  if (value == null) return null;
  const n = Number(String(value).replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function findPossession(stats) {
  for (const period of stats?.statistics ?? []) {
    for (const group of period.groups ?? []) {
      for (const item of group.statisticsItems ?? []) {
        const key = String(item.key ?? item.name ?? "").toLowerCase();
        if (key.includes("possession") || key.includes("posse")) {
          return { home: parsePercent(item.home), away: parsePercent(item.away) };
        }
      }
    }
  }
  return { home: null, away: null };
}

const FINISHED_TYPES = new Set(["finished", "canceled", "postponed"]);

function isFinished(statusType) {
  return FINISHED_TYPES.has((statusType ?? "").toLowerCase());
}

async function notifyApp(eventId, homeScore, awayScore, homePossession) {
  if (!APP_URL || !SYNC_SECRET) {
    console.log("[poll] APP_URL ou SYNC_SECRET não configurados — skip notificação");
    return;
  }
  try {
    const res = await fetch(`${APP_URL}/api/sync-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sync-secret": SYNC_SECRET },
      body: JSON.stringify({ event_id: eventId, home_score: homeScore, away_score: awayScore, home_possession: homePossession }),
    });
    if (res.ok) console.log(`[poll] sync-result OK para event=${eventId}`);
    else console.warn(`[poll] sync-result HTTP ${res.status} para event=${eventId}`);
  } catch (err) {
    console.warn(`[poll] sync-result falhou: ${err.message}`);
  }
}

async function main() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  // Busca jogos com sofascore_id dentro da janela de polling
  const { data: games, error } = await supabase
    .from("games")
    .select("id, sofascore_id, home_score, away_score, ball_possession_home, status_type")
    .not("sofascore_id", "is", null)
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error) {
    console.error("[poll] Erro ao buscar jogos:", error.message);
    process.exit(1);
  }

  // Filtra jogos não-finalizados
  const active = (games ?? []).filter(g => !isFinished(g.status_type));

  if (active.length === 0) {
    console.log("[poll] Nenhum jogo ativo para polling.");
    return;
  }

  console.log(`[poll] ${active.length} jogo(s) ativo(s)`);

  for (const game of active) {
    const id = game.sofascore_id;
    try {
      const [eventData, statsData] = await Promise.all([
        sofascoreGet(`/event/${id}`),
        sofascoreGet(`/event/${id}/statistics`).catch(() => null),
      ]);

      const event = eventData.event;
      const newStatusType = event?.status?.type ?? null;
      const newHomeScore  = event?.homeScore?.current ?? null;
      const newAwayScore  = event?.awayScore?.current ?? null;
      const possession    = statsData ? findPossession(statsData) : { home: null, away: null };

      await supabase
        .from("games")
        .update({
          home_score: newHomeScore,
          away_score: newAwayScore,
          ball_possession_home: possession.home,
          status_type: newStatusType,
          status_description: event?.status?.description ?? null,
        })
        .eq("id", game.id);

      console.log(`[poll] event=${id} score=${newHomeScore}-${newAwayScore} posse=${possession.home} status=${newStatusType}`);

      // Detecta transição para finished
      const wasFinished = isFinished(game.status_type);
      if (isFinished(newStatusType) && !wasFinished) {
        console.log(`[poll] Jogo finalizado (event=${id}) — notificando app`);
        await notifyApp(id, newHomeScore, newAwayScore, possession.home);
      }

    } catch (err) {
      console.warn(`[poll] Falha event=${id}: ${err.message}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
