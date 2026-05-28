import { chromium } from "playwright";
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const { Pool } = pg;

loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;
const EVENT_ID = Number(process.env.EVENT_ID || "15926535");
const MATCH_URL =
  process.env.MATCH_URL ||
  "https://www.sofascore.com/pt/football/match/panama-brazil/YUbsodc#id:15926535";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || "300000");
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SYNC_SECRET = process.env.SYNC_SECRET || "";
const ONCE = process.argv.includes("--once");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Copy .env.example and set the variable.");
}

const pool = new Pool({ connectionString: DATABASE_URL });

// Rastreia último status para detectar mudança para "finished"
let lastStatus = null;

function loadEnvFile() {
  if (!existsSync(".env")) return;

  const env = readFileSync(".env", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      referer: MATCH_URL,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Sofascore API ${response.status} for ${url}`);
  }

  return response.json();
}

function normalizeFromApi(eventPayload, incidentsPayload, statisticsPayload) {
  const event = eventPayload.event;
  const goals = (incidentsPayload.incidents || [])
    .filter((incident) => incident.incidentType === "goal")
    .map((incident) => ({
      minute: incident.time,
      addedTime: incident.addedTime || null,
      team: incident.isHome ? "home" : "away",
      player: incident.playerName || incident.player?.name || null,
      homeScore: incident.homeScore ?? null,
      awayScore: incident.awayScore ?? null
    }));

  const possession = findPossession(statisticsPayload);

  return {
    eventId: event.id,
    matchUrl: MATCH_URL,
    homeTeam: event.homeTeam?.name || null,
    awayTeam: event.awayTeam?.name || null,
    status: event.status?.description || event.status?.type || null,
    homeScore: event.homeScore?.current ?? null,
    awayScore: event.awayScore?.current ?? null,
    homePossession: possession.home,
    awayPossession: possession.away,
    goals,
    raw: { event, incidents: incidentsPayload.incidents || [], statistics: statisticsPayload }
  };
}

function findPossession(statisticsPayload) {
  const groups = statisticsPayload.statistics || [];

  for (const period of groups) {
    for (const group of period.groups || []) {
      for (const item of group.statisticsItems || []) {
        const name = String(item.name || item.key || "").toLowerCase();
        if (name.includes("possession") || name.includes("posse")) {
          return {
            home: parsePercent(item.home),
            away: parsePercent(item.away)
          };
        }
      }
    }
  }

  return { home: null, away: null };
}

function parsePercent(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchViaApi() {
  const [eventPayload, incidentsPayload, statisticsPayload] = await Promise.all([
    fetchJson(`https://api.sofascore.com/api/v1/event/${EVENT_ID}`),
    fetchJson(`https://api.sofascore.com/api/v1/event/${EVENT_ID}/incidents`),
    fetchJson(`https://api.sofascore.com/api/v1/event/${EVENT_ID}/statistics`)
  ]);

  return normalizeFromApi(eventPayload, incidentsPayload, statisticsPayload);
}

async function fetchViaBrowser() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
  });

  try {
    await page.goto(MATCH_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(5000);

    const text = await page.locator("main").innerText({ timeout: 15000 });
    return normalizeFromRenderedText(text);
  } finally {
    await browser.close();
  }
}

function normalizeFromRenderedText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const scoreLine = lines.find((line) => /^\d+\s*-\s*\d+$/.test(line));
  const [homeScore, awayScore] = scoreLine
    ? scoreLine.split("-").map((part) => Number(part.trim()))
    : [null, null];

  const possessionIndex = lines.findIndex((line) => line.toLowerCase() === "posse de bola");
  const homePossession =
    possessionIndex > 0 ? parsePercent(lines[possessionIndex - 1]) : null;
  const awayPossession =
    possessionIndex >= 0 ? parsePercent(lines[possessionIndex + 1]) : null;

  const goals = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\d+'\s*(\+\d+)?$/.test(lines[i]) && /gol/i.test(lines[i + 1] || "")) {
      goals.push({
        minute: lines[i],
        team: null,
        player: lines[i + 2] || null,
        homeScore: null,
        awayScore: null
      });
    }
  }

  return {
    eventId: EVENT_ID,
    matchUrl: MATCH_URL,
    homeTeam: "Brazil",
    awayTeam: "Panama",
    status: inferStatus(lines),
    homeScore,
    awayScore,
    homePossession,
    awayPossession,
    goals,
    raw: { renderedText: text }
  };
}

function inferStatus(lines) {
  return (
    lines.find((line) =>
      ["Intervalo", "Full time", "Encerrado", "Ao vivo"].some((status) =>
        line.includes(status)
      )
    ) || null
  );
}

async function fetchMatchState() {
  try {
    return await fetchViaApi();
  } catch (error) {
    console.warn(`[poller] API failed, falling back to browser: ${error.message}`);
    return fetchViaBrowser();
  }
}

async function saveMatchState(state) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    await client.query(
      `insert into match_snapshots (
        event_id, match_url, status, home_score, away_score,
        home_possession, away_possession, goals, raw, fetched_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
      [
        state.eventId,
        state.matchUrl,
        state.status,
        state.homeScore,
        state.awayScore,
        state.homePossession,
        state.awayPossession,
        JSON.stringify(state.goals),
        JSON.stringify(state.raw)
      ]
    );

    await client.query(
      `insert into match_latest (
        event_id, match_url, home_team, away_team, status, home_score, away_score,
        home_possession, away_possession, goals, raw, fetched_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
      on conflict (event_id) do update set
        match_url = excluded.match_url,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        status = excluded.status,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        home_possession = excluded.home_possession,
        away_possession = excluded.away_possession,
        goals = excluded.goals,
        raw = excluded.raw,
        fetched_at = excluded.fetched_at,
        updated_at = now()`,
      [
        state.eventId,
        state.matchUrl,
        state.homeTeam,
        state.awayTeam,
        state.status,
        state.homeScore,
        state.awayScore,
        state.homePossession,
        state.awayPossession,
        JSON.stringify(state.goals),
        JSON.stringify(state.raw)
      ]
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

// Notifica o app Next.js quando o jogo termina para atualizar games + recalcular scores
async function notifyGameFinished(state) {
  if (!APP_URL || !SYNC_SECRET) return;
  try {
    const res = await fetch(`${APP_URL}/api/sync-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": SYNC_SECRET,
      },
      body: JSON.stringify({
        event_id: state.eventId,
        home_score: state.homeScore,
        away_score: state.awayScore,
        home_possession: state.homePossession,
      }),
    });
    if (res.ok) {
      console.log(`[poller] sync-result OK para event=${state.eventId}`);
    } else {
      console.warn(`[poller] sync-result HTTP ${res.status} para event=${state.eventId}`);
    }
  } catch (err) {
    console.warn(`[poller] sync-result falhou: ${err.message}`);
  }
}

const FINISHED_STATUSES = ["finished", "full time", "encerrado", "awarded"];

function isFinished(status) {
  if (!status) return false;
  return FINISHED_STATUSES.some((s) => status.toLowerCase().includes(s));
}

async function pollOnce() {
  const state = await fetchMatchState();
  await saveMatchState(state);
  console.log(
    `[poller] saved event=${state.eventId} score=${state.homeScore}-${state.awayScore} possession=${state.homePossession}-${state.awayPossession} status=${state.status}`
  );

  // Detecta transição para "finished" e notifica o app
  if (isFinished(state.status) && !isFinished(lastStatus)) {
    console.log(`[poller] jogo finalizado — notificando app`);
    await notifyGameFinished(state);
  }

  lastStatus = state.status;
}

async function main() {
  await pollOnce();

  if (ONCE) {
    await pool.end();
    return;
  }

  setInterval(() => {
    pollOnce().catch((error) => {
      console.error(`[poller] ${error.stack || error.message}`);
    });
  }, POLL_INTERVAL_MS);
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
