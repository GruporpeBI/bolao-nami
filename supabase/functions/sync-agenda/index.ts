/**
 * sync-agenda Edge Function
 *
 * Runs daily (via pg_cron at 03:00 UTC) and also on-demand via HTTP POST.
 * Scans the World Cup tournament window on Sofascore and upserts relevant
 * matches into the `games` table.
 *
 * Relevant matches: Brazil games + semifinals + finals.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  dateRange,
  fetchScheduledEvents,
  isBrazilMatch,
  isFinal,
  isRelevantMatch,
  isSemifinal,
  SofascoreEvent,
  stageFromSofascore,
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
// Tournament window
// ---------------------------------------------------------------------------

const TOURNAMENT_START = "2026-06-01";
const TOURNAMENT_END = "2026-07-31";

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
    job_name: "sync-agenda",
    status,
    message,
    metadata,
  });
}

// ---------------------------------------------------------------------------
// Upsert logic
// ---------------------------------------------------------------------------

interface GameUpsertRow {
  sofascore_id: number;
  sofascore_url: string;
  home_team: string;
  away_team: string;
  stage: string;
  scheduled_at: string;
  is_brazil_game: boolean;
  is_final: boolean;
  status_type: string | null;
  status_description: string | null;
}

function buildGameRow(event: SofascoreEvent): GameUpsertRow {
  const startTs = event.startTimestamp
    ? new Date(event.startTimestamp * 1000).toISOString()
    : new Date().toISOString();

  const slug = event.customId ?? event.slug ?? String(event.id);
  const sofascoreUrl = `https://www.sofascore.com/football/match/${slug}`;

  return {
    sofascore_id: event.id,
    sofascore_url: sofascoreUrl,
    home_team: event.homeTeam.name,
    away_team: event.awayTeam.name,
    stage: stageFromSofascore(event),
    scheduled_at: startTs,
    is_brazil_game: isBrazilMatch(event),
    is_final: isFinal(event),
    status_type: event.status?.type ?? null,
    status_description: event.status?.description ?? null,
  };
}

/**
 * Try to find an existing game row that was seeded from football-data.org
 * matching by date + home_team name (ILIKE). Returns the row id or null.
 */
async function findExistingGameByDateAndTeam(
  supabase: ReturnType<typeof createClient>,
  scheduledAt: string,
  homeTeam: string
): Promise<string | null> {
  const datePart = scheduledAt.slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from("games")
    .select("id, home_team")
    .is("sofascore_id", null)
    .gte("scheduled_at", `${datePart}T00:00:00Z`)
    .lt("scheduled_at", `${datePart}T23:59:59Z`);

  if (error || !data) return null;

  const normalise = (s: string) =>
    s.toLowerCase().replace(/[^a-z]/g, "").trim();
  const targetHome = normalise(homeTeam);

  for (const row of data as { id: string; home_team: string }[]) {
    const existingHome = normalise(row.home_team);
    if (
      existingHome.includes(targetHome) ||
      targetHome.includes(existingHome)
    ) {
      return row.id;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
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

  await logRun(supabase, "started", "sync-agenda started");

  const dates = dateRange(TOURNAMENT_START, TOURNAMENT_END);
  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const date of dates) {
    const { events, error: fetchError } = await fetchScheduledEvents(date);

    if (fetchError) {
      errors.push(`${date}: ${fetchError}`);
      continue;
    }

    const relevant = events.filter(isRelevantMatch);

    for (const event of relevant) {
      const row = buildGameRow(event);

      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("sofascore_id", event.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("games")
          .update({
            status_type: row.status_type,
            status_description: row.status_description,
            sofascore_url: row.sofascore_url,
          })
          .eq("sofascore_id", event.id);
        skipped++;
        continue;
      }

      const existingId = await findExistingGameByDateAndTeam(
        supabase,
        row.scheduled_at,
        row.home_team
      );

      if (existingId) {
        const { error: linkError } = await supabase
          .from("games")
          .update({
            sofascore_id: row.sofascore_id,
            sofascore_url: row.sofascore_url,
            status_type: row.status_type,
            status_description: row.status_description,
          })
          .eq("id", existingId);

        if (linkError) {
          errors.push(
            `Failed to link sofascore_id=${event.id} to game ${existingId}: ${linkError.message}`
          );
          skipped++;
        } else {
          synced++;
        }
        continue;
      }

      const insertPayload = {
        ...row,
        is_enabled: false,
        external_id: null,
      };

      const { error: insertError } = await supabase
        .from("games")
        .insert(insertPayload);

      if (insertError) {
        if (insertError.code === "23505") {
          skipped++;
        } else {
          errors.push(
            `Insert failed for sofascore_id=${event.id}: ${insertError.message}`
          );
          skipped++;
        }
      } else {
        synced++;
      }
    }
  }

  const finalStatus = errors.length === 0 ? "success" : "error";
  const message =
    errors.length === 0
      ? `Completed: ${synced} synced, ${skipped} skipped`
      : `Completed with ${errors.length} error(s): ${synced} synced, ${skipped} skipped`;

  await logRun(supabase, finalStatus, message, {
    synced,
    skipped,
    errors: errors.slice(0, 50),
  });

  return new Response(
    JSON.stringify({ ok: true, synced, skipped, errors: errors.slice(0, 10) }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    }
  );
});
