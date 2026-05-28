import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Esta rota é chamada diariamente pelo Vercel Cron (vercel.json)
// Usa service role key para contornar RLS e inserir/atualizar jogos
export const runtime = "nodejs";
export const maxDuration = 30;

const STAGE_MAP: Record<string, Database["public"]["Tables"]["games"]["Row"]["stage"]> = {
  GROUP_STAGE: "group",
  LAST_16: "round_of_16",
  QUARTER_FINALS: "quarterfinal",
  SEMI_FINALS: "semifinal",
  FINAL: "final",
};

interface FDTeam { tla: string; shortName: string; name: string; }
interface FDMatch {
  id: number;
  utcDate: string;
  stage: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

function isBrazilMatch(m: FDMatch): boolean {
  return (
    m.homeTeam?.tla === "BRA" || m.awayTeam?.tla === "BRA" ||
    m.homeTeam?.shortName === "Brazil" || m.awayTeam?.shortName === "Brazil"
  );
}

export async function GET(req: NextRequest) {
  // Valida secret do Vercel Cron (Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.FOOTBALL_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "FOOTBALL_API_TOKEN not configured" }, { status: 500 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
  }

  // Client com service role — bypassa RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Busca todos os jogos da Copa do Mundo 2026
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": apiToken },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `football-data.org: ${res.status}` }, { status: 502 });
  }

  const data = await res.json() as { matches: FDMatch[] };
  const matches = data.matches ?? [];

  // Filtra: jogos do Brasil + semifinais + final
  const relevant = matches.filter(
    (m) => isBrazilMatch(m) || m.stage === "SEMI_FINALS" || m.stage === "FINAL"
  );

  const records = relevant.map((m) => ({
    external_id: m.id,
    home_team: m.homeTeam?.name || "A definir",
    away_team: m.awayTeam?.name || "A definir",
    stage: STAGE_MAP[m.stage] ?? "group",
    scheduled_at: m.utcDate,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    ball_possession_home: null as number | null,
    is_brazil_game: isBrazilMatch(m),
    is_final: m.stage === "FINAL",
    // Habilita automaticamente jogos do Brasil; semifinais/final ficam desabilitadas até o admin confirmar
    is_enabled: isBrazilMatch(m),
  }));

  const { error } = await supabase
    .from("games")
    .upsert(records as never[], { onConflict: "external_id", ignoreDuplicates: false });

  if (error) {
    console.error("[cron/sync-games] upsert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron/sync-games] sincronizados ${records.length} jogos`);
  return NextResponse.json({
    ok: true,
    synced: records.length,
    brazil_games: records.filter((r) => r.is_brazil_game).length,
  });
}
