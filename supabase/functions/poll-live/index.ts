/**
 * poll-live Edge Function
 *
 * Runs every 5 minutes (via pg_cron). For each game that is currently live
 * or about to start, fetches scores and statistics from Sofascore and
 * updates the `games` table. When a game transitions to "finished", it
 * notifies the Next.js app to recalculate scores.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchEvent,
  fetchEventStatistics,
  findPossession,
} from "../_shared/sofascore.ts";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameRow {
  id: string;
  sofascore_id: number;
  home_score: number | null;
  away_score: number | null;
  ball_possession_home: number | null;
  status_type: string | null;
  status_description: string | null;
}

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

async function logRun(
  supabase: ReturnType<typeof createClient>,
  status: "started" | "success" | "error",
  message: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from("world_cup_sync_runs").insert({
    job_name: "poll-live",
    status,
    message,
    metadata,
  });
}

// ---------------------------------------------------------------------------
// Notify Next.js app to recalculate scores
// ---------------------------------------------------------------------------

async function notifyScoreRecalculation(params: {
  event_id: number;
  home_score: number | null;
  away_score: number | null;
  home_possession: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = Deno.env.get("APP_URL");
  const syncSecret = Deno.env.get("SYNC_SECRET") ?? "bolao_sync_2026";

  if (!appUrl) {
    return { ok: false, error: "APP_URL env var not set" };
  }

  const url = `${appUrl.replace(/\/$/, "")}/api/sync-result`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": syncSecret,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `HTTP ${res.status} from ${url}: ${text.slice(0, 200)}`,
      };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseAdmin();

  await logRun(supabase, "started", "poll-live started");

  // Find games that are live or about to start (within the polling window),
  // excluding already-finished/canceled/postponed games.
  const { data: gamesData, error: queryError } = await supabase
    .from("games")
    .select(
      "id, sofascore_id, home_score, away_score, ball_possession_home, status_type, status_description"
    )
    .not("sofascore_id", "is", null)
    .gte(
      "scheduled_at",
      new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    )
    .lte(
      "scheduled_at",
      new Date(Date.now() + 30 * 60 * 1000).toISOString()
    )
    .not("status_type", "in", '("finished","canceled","postponed")');

  if (queryError) {
    const msg = `Failed to query games: ${queryError.message}`;
    await logRun(supabase, "error", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const games = (gamesData ?? []) as GameRow[];

  if (games.length === 0) {
    await logRun(supabase, "success", "No live games to poll", { polled: 0 });
    return new Response(
      JSON.stringify({ ok: true, polled: 0, updated: 0 }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  let updated = 0;
  const errors: string[] = [];
  const notifications: string[] = [];

  for (const game of games) {
    const eventId = game.sofascore_id;

    // Fetch current event data
    const eventResult = await fetchEvent(eventId);

    if (!eventResult.data) {
      errors.push(
        `Event ${eventId}: ${eventResult.error ?? "No data returned"}`
      );
      continue;
    }

    const event = eventResult.data.event;
    const newStatusType = event.status?.type ?? null;
    const newStatusDescription = event.status?.description ?? null;

    const newHomeScore = event.homeScore?.current ?? null;
    const newAwayScore = event.awayScore?.current ?? null;

    // Fetch possession statistics
    let possessionHome: number | null = null;

    const statsResult = await fetchEventStatistics(eventId);
    if (statsResult.data) {
      const poss = findPossession(statsResult.data);
      possessionHome = poss.home;
    }
    // If stats returns 404/403 (match not started yet), that's fine — keep null

    // Update the game row
    const { error: updateError } = await supabase
      .from("games")
      .update({
        home_score: newHomeScore,
        away_score: newAwayScore,
        ball_possession_home: possessionHome,
        status_type: newStatusType,
        status_description: newStatusDescription,
      })
      .eq("id", game.id);

    if (updateError) {
      errors.push(`Update game ${game.id}: ${updateError.message}`);
      continue;
    }

    updated++;

    // If the game just finished, notify Next.js to recalculate scores
    const wasFinished =
      game.status_type === "finished" ||
      game.status_type === "canceled" ||
      game.status_type === "postponed";

    const isNowFinished = newStatusType === "finished";

    if (isNowFinished && !wasFinished) {
      const notifyResult = await notifyScoreRecalculation({
        event_id: eventId,
        home_score: newHomeScore,
        away_score: newAwayScore,
        home_possession: possessionHome,
      });

      if (notifyResult.ok) {
        notifications.push(`Notified finish for event ${eventId}`);
      } else {
        errors.push(
          `Notification failed for event ${eventId}: ${notifyResult.error}`
        );
      }
    }
  }

  const finalStatus = errors.length === 0 ? "success" : "error";
  const message = `Polled ${games.length} games, updated ${updated}, notifications: ${notifications.length}`;

  await logRun(supabase, finalStatus, message, {
    polled: games.length,
    updated,
    notifications,
    errors: errors.slice(0, 50),
  });

  return new Response(
    JSON.stringify({
      ok: true,
      polled: games.length,
      updated,
      notifications: notifications.length,
      errors: errors.slice(0, 10),
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
});
