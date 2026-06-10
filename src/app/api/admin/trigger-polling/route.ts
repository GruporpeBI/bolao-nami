/**
 * POST /api/admin/trigger-polling
 *
 * Dispara polling manual para um jogo específico ou para todos os jogos ativos
 * Requer: x-sync-secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_access")) return true;
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 500 }
    );
  }

  try {
    const db = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const gameId = body.gameId; // Opcional: ID específico

    console.log("[polling] Buscando jogos para polling...");

    // Se gameId específico, disparar para esse
    // Caso contrário, disparar para todos os jogos ativos (scheduled_at <= now AND is_enabled)
    let query = db
      .from("games")
      .select("id, home_team, away_team, thesportsdb_event_id, espn_event_id, scheduled_at")
      .eq("is_enabled", true as unknown as string)
      .lte("scheduled_at", new Date().toISOString()); // Jogos que já começaram ou começando agora

    if (gameId) {
      query = query.eq("id", gameId);
    }

    const { data: games } = await query.limit(50);

    if (!games || games.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Nenhum jogo ativo para polling",
        games_found: 0,
      });
    }

    console.log(`[polling] Disparando polling para ${games.length} jogo(s)...`);

    const results = [];

    // Disparar polling para cada jogo
    for (const game of games) {
      const triggers = [];

      // TheSportsDB
      if (game.thesportsdb_event_id) {
        try {
          const tdbRes = await fetch(`${supabaseUrl}/functions/v1/poll-thesportsdb`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ game_id: game.id }),
          });
          triggers.push({
            source: "thesportsdb",
            status: tdbRes.status,
          });
        } catch (e) {
          triggers.push({
            source: "thesportsdb",
            error: String(e),
          });
        }
      }

      // ESPN
      if (game.espn_event_id) {
        try {
          const espnRes = await fetch(`${supabaseUrl}/functions/v1/poll-espn`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ game_id: game.id }),
          });
          triggers.push({
            source: "espn",
            status: espnRes.status,
          });
        } catch (e) {
          triggers.push({
            source: "espn",
            error: String(e),
          });
        }
      }

      results.push({
        game: `${game.home_team} vs ${game.away_team}`,
        game_id: game.id,
        triggers,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Polling disparado com sucesso",
      games_polled: games.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[polling] Erro:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
