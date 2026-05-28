import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recalculateScores } from "@/app/admin/actions";

export async function POST(req: NextRequest) {
  // Valida o secret para que só o poller possa chamar esta rota
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event_id?: number; home_score?: number; away_score?: number; home_possession?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_id, home_score, away_score, home_possession } = body;

  if (!event_id) {
    return NextResponse.json({ error: "event_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Try sofascore_id first, then fall back to external_id (football-data.org)
  let gameResult = await supabase
    .from("games")
    .select("id")
    .eq("sofascore_id", event_id)
    .maybeSingle();

  if (!gameResult.data) {
    gameResult = await supabase
      .from("games")
      .select("id")
      .eq("external_id", event_id)
      .maybeSingle();
  }

  const { data: game, error: findError } = gameResult;

  if (findError || !game) {
    return NextResponse.json({ error: "Game not found for event_id " + event_id }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({
      home_score: home_score ?? null,
      away_score: away_score ?? null,
      ball_possession_home: home_possession ?? null,
    } as never)
    .eq("id", (game as { id: string }).id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Recalcula pontuação de todos os usuários
  await recalculateScores();

  return NextResponse.json({ ok: true, game_id: (game as { id: string }).id });
}
