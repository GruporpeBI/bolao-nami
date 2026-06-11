import { createClient } from "@/lib/supabase/server";
import { IconEscudo } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import GameCard from "./GameCard";
import TournamentPredictions from "./TournamentPredictions";
import { getLocationConfig } from "@/app/admin/actions";
import type { Database } from "@/lib/supabase/types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];
type TournamentPredRow = Database["public"]["Tables"]["tournament_predictions"]["Row"];

function todayBrasilia(): string {
  const now = new Date();
  const brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brasilia.toISOString().slice(0, 10);
}

function gameDayBrasilia(scheduledAt: string): string {
  const d = new Date(new Date(scheduledAt).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export default async function PalpitesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const dbUserId: string | null = user
    ? ((user.user_metadata?.users_table_id as string | undefined) ?? user.id)
    : null;

  const { data: gamesData } = await supabase
    .from("games")
    .select("*")
    .eq("is_enabled", true as unknown as string)
    .order("scheduled_at", { ascending: true });

  const allEnabled = (gamesData as GameRow[] | null) ?? [];
  const today = todayBrasilia();

  // Jogos regulares + semi/final liberadas como card SÓ no dia do jogo:
  //   - final: sempre vira card no dia (mesmo sem o Brasil)
  //   - semifinal: vira card no dia apenas se for jogo do Brasil
  const regularGames = allEnabled.filter((g) => {
    if (g.stage !== "semifinal" && g.stage !== "final") return true; // jogos normais
    if (gameDayBrasilia(g.scheduled_at) !== today) return false;     // semi/final: só no dia
    if (g.stage === "final") return true;                            // final: sempre
    return g.is_brazil_game;                                          // semifinal: só se for Brasil
  });

  // Jogo com check-in habilitado hoje para check-in
  const todayCheckinGame = allEnabled.find(
    (g) => g.checkin_enabled && gameDayBrasilia(g.scheduled_at) === today
  ) ?? null;

  const locationConfig = await getLocationConfig();

  let predictions: Record<string, {
    home_score_pred: number;
    away_score_pred: number;
    possession_pred: number;
  }> = {};

  let tournamentPrediction: TournamentPredRow | null = null;
  let alreadyCheckedIn = false;

  if (dbUserId) {
    const gameIds = allEnabled.map((g) => g.id);

    if (gameIds.length > 0) {
      const { data: predsData } = await supabase
        .from("predictions")
        .select("game_id, home_score_pred, away_score_pred, possession_pred")
        .eq("user_id", dbUserId)
        .in("game_id", gameIds);

      for (const p of (predsData as Pick<PredictionRow, "game_id" | "home_score_pred" | "away_score_pred" | "possession_pred">[] | null) ?? []) {
        predictions[p.game_id] = {
          home_score_pred: p.home_score_pred,
          away_score_pred: p.away_score_pred,
          possession_pred: p.possession_pred,
        };
      }
    }

    const { data: tp } = await supabase
      .from("tournament_predictions")
      .select("*")
      .eq("user_id", dbUserId)
      .single();

    tournamentPrediction = (tp as TournamentPredRow | null) ?? null;

    if (todayCheckinGame) {
      const { data: att } = await supabase
        .from("attendances")
        .select("id")
        .eq("user_id", dbUserId)
        .eq("game_id", todayCheckinGame.id)
        .maybeSingle();
      alreadyCheckedIn = !!att;
    }
  }

  const hasTournamentPrediction = !!tournamentPrediction;

  // Conta jogos da Copa Brasil finalizados (espn_league = fifa.world com resultado)
  const tournamentDeadlinePassed = allEnabled.filter(
    (g) => g.is_brazil_game &&
           g.home_score != null &&
           (g as { espn_league?: string | null }).espn_league === "fifa.world"
  ).length >= 3;

  // Ordena os jogos: janela de palpite ABERTA primeiro (e dentro disso, os ainda não
  // palpitados antes), depois os demais — sempre cronológico dentro de cada grupo.
  const nowMs = Date.now();
  const predictionOpen = (g: GameRow): boolean => {
    const isPredDay = !!(g as { predictions_early?: boolean }).predictions_early || gameDayBrasilia(g.scheduled_at) === today;
    const deadlineMs = new Date(g.scheduled_at).getTime() - 5 * 60 * 1000;
    return isPredDay && nowMs < deadlineMs;
  };
  const gameTier = (g: GameRow): number => {
    if (predictionOpen(g)) return predictions[g.id] ? 1 : 0; // 0 = aberto sem palpite, 1 = aberto já palpitado
    return 2;                                                 // 2 = fechado / ainda não aberto
  };
  const orderedGames = [...regularGames].sort((a, b) => {
    const t = gameTier(a) - gameTier(b);
    if (t !== 0) return t;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-10">
          <IconEscudo width={56} height={95} />
          <div>
            <h1 className="text-3xl font-bold text-[#F6C900] uppercase tracking-tight">
              Meus Palpites
            </h1>
            <p className="text-[#FAF6EB]/50 text-sm mt-1">
              Envie seu palpite até 5 minutos antes de cada jogo
            </p>
          </div>
        </div>


        {!dbUserId && (
          <div className="border border-[#F6C900]/20 rounded-sm px-5 py-4 mb-8 text-[#FAF6EB]/70 text-sm">
            <a href="/cadastro" className="text-[#F6C900] font-semibold underline underline-offset-2">
              Faça login
            </a>{" "}
            para enviar palpites.
          </div>
        )}

        {/* ── PALPITES DO TORNEIO ── */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#FAF6EB] uppercase tracking-tight mb-1">
            Palpites do Torneio
          </h2>
          <p className="text-[#FAF6EB]/40 text-sm mb-4">
            Preencha semifinalistas, finalistas e campeão antes de enviar palpites de jogo.
          </p>
          <TournamentPredictions
            disabled={!dbUserId}
            existing={tournamentPrediction}
            tournamentDeadlinePassed={tournamentDeadlinePassed}
          />
        </div>


        {/* ── JOGOS ── */}
        {regularGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Badge variant="dark">Em breve</Badge>
            <p className="text-[#FAF6EB]/50 text-lg">Nenhum jogo disponível.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orderedGames.map((game) => {
              const isPredictionDay = !!(game as { predictions_early?: boolean }).predictions_early || gameDayBrasilia(game.scheduled_at) === today;
              const isThisGameCheckedIn = alreadyCheckedIn && todayCheckinGame?.id === game.id;
              const checkinEnabled = !!(game as { checkin_enabled?: boolean }).checkin_enabled;
              // Check-in vale no dia do jogo (não em predictions_early)
              const isCheckInDay = checkinEnabled && gameDayBrasilia(game.scheduled_at) === today;
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  existingPrediction={predictions[game.id] ?? null}
                  hasTournamentPrediction={hasTournamentPrediction}
                  tournamentDeadlinePassed={tournamentDeadlinePassed}
                  isLoggedIn={!!dbUserId}
                  isPredictionDay={isPredictionDay}
                  alreadyCheckedIn={isThisGameCheckedIn}
                  isGameDay={isCheckInDay}
                  isOpen={predictionOpen(game)}
                  restaurantLat={locationConfig.lat}
                  restaurantLng={locationConfig.lng}
                  radiusM={locationConfig.radiusM}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
