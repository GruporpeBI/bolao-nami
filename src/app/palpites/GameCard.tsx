"use client";

import { useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CountdownTimer from "./CountdownTimer";
import PredictionForm from "./PredictionForm";
import CheckInButton, { type CheckInHandle } from "./CheckInButton";
import { teamName, teamFlagUrl } from "@/lib/team-names";

interface GameCardProps {
  game: {
    id: string;
    home_team: string;
    away_team: string;
    stage: string;
    scheduled_at: string;
    is_brazil_game: boolean;
    is_final: boolean;
    home_score?: number | null;
    away_score?: number | null;
    ball_possession_home?: number | null;
  };
  existingPrediction?: {
    home_score_pred: number;
    away_score_pred: number;
    possession_pred: number;
  } | null;
  hasTournamentPrediction: boolean;
  tournamentDeadlinePassed: boolean;
  isLoggedIn: boolean;
  isPredictionDay: boolean;
  alreadyCheckedIn: boolean;
  isGameDay: boolean;
  isOpen: boolean;
  restaurantLat: number;
  restaurantLng: number;
  radiusM: number;
}

const stageLabel: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_16: "Oitavas de Final",
  quarterfinal: "Quartas de Final",
  semifinal: "Semifinal",
  final: "Final",
};

export default function GameCard({
  game,
  existingPrediction,
  hasTournamentPrediction,
  tournamentDeadlinePassed,
  isLoggedIn,
  isPredictionDay,
  alreadyCheckedIn,
  isGameDay,
  isOpen,
  restaurantLat,
  restaurantLng,
  radiusM,
}: GameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const checkInRef = useRef<CheckInHandle>(null);

  const homeTeam = teamName(game.home_team);
  const awayTeam = teamName(game.away_team);
  const homeFlagUrl = teamFlagUrl(game.home_team);
  const awayFlagUrl = teamFlagUrl(game.away_team);

  const scheduledAt = new Date(game.scheduled_at);
  const deadline = new Date(scheduledAt.getTime() - 5 * 60 * 1000);
  const isPastDeadline = Date.now() >= deadline.getTime();
  const gameStarted = Date.now() >= scheduledAt.getTime();
  // Check-in disponível no dia do jogo até o kickoff (independe do palpite)
  const checkInOpen = isGameDay && !gameStarted;

  const dateStr = scheduledAt.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const timeStr = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const canPredict = isLoggedIn && !isPastDeadline && !existingPrediction && isPredictionDay;
  const needsTournament = canPredict && !hasTournamentPrediction && !tournamentDeadlinePassed;
  const hasResult = game.home_score != null && game.away_score != null;

  // Retorna o time com > 50% de posse e o valor, ou null se sem dado / empate técnico
  function dominantPossession(): { team: string; pct: number } | null {
    const hp = game.ball_possession_home;
    // 0/100 (ou null) = sem dado de posse → não exibe
    if (hp == null || hp <= 0 || hp >= 100) return null;
    if (hp > 50) return { team: teamName(game.home_team), pct: hp };
    if (hp < 50) return { team: teamName(game.away_team), pct: 100 - hp };
    return null; // exatamente 50/50
  }
  const poss = dominantPossession();

  function handlePredictClick() {
    setExpanded((v) => !v);
  }

  return (
    <Card
      variant="dark"
      className={`p-5 ${isOpen ? "ring-1 ring-[#CC5723]/70 border-[#CC5723]/60 bg-gradient-to-br from-[#CC5723]/10 to-[#251008]" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[#F0EADD]/50 text-xs uppercase tracking-wider">
            {stageLabel[game.stage] ?? game.stage}
          </span>
          {game.is_brazil_game && <Badge variant="green">🇧🇷 Brasil</Badge>}
          {game.is_final && <Badge variant="gold">Final</Badge>}
        </div>
        <span className="text-[#F0EADD]/50 text-xs">
          {dateStr} às {timeStr}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 my-4">
        {/* Home */}
        <div className="flex items-center justify-end gap-2 flex-1">
          <span className="font-[var(--font-cond)] text-[#D96D3A] font-black text-lg uppercase tracking-wide text-right">{homeTeam}</span>
          {homeFlagUrl && (
            <img src={homeFlagUrl} alt={homeTeam} className="w-6 h-6 rounded-sm object-cover flex-shrink-0" />
          )}
        </div>

        {/* Placar ou × */}
        {hasResult ? (
          <div className="flex flex-col items-center shrink-0">
            <span className="font-[var(--font-cond)] text-[#D96D3A] font-black text-3xl tabular-nums leading-none">
              {game.home_score} – {game.away_score}
            </span>
            {poss && (
              <span className="text-[#F0EADD]/35 text-[10px] mt-0.5 font-normal">
                {poss.team} {poss.pct}% posse
              </span>
            )}
          </div>
        ) : (
          <span className="font-[var(--font-cond)] text-[#F0EADD]/25 font-black text-2xl shrink-0">×</span>
        )}

        {/* Away */}
        <div className="flex items-center justify-start gap-2 flex-1">
          {awayFlagUrl && (
            <img src={awayFlagUrl} alt={awayTeam} className="w-6 h-6 rounded-sm object-cover flex-shrink-0" />
          )}
          <span className="font-[var(--font-cond)] text-[#F0EADD] font-black text-lg uppercase tracking-wide text-left">{awayTeam}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {isPastDeadline ? (
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
              Encerrado
            </span>
          ) : isPredictionDay ? (
            <>
              <span className="text-[#F0EADD]/50 text-xs shrink-0">Fecha em:</span>
              <CountdownTimer target={deadline} />
            </>
          ) : (
            <CountdownTimer target={scheduledAt} />
          )}
        </div>

        {canPredict && !needsTournament && (
          <Button
            variant="gold"
            size="sm"
            onClick={handlePredictClick}
            className="self-start"
          >
            {expanded ? "Fechar" : "Fazer palpite"}
          </Button>
        )}
      </div>

      {/* Aviso: palpite só no dia do jogo */}
      {!isPredictionDay && !existingPrediction && !isPastDeadline && (
        <p className="text-xs text-[#F0EADD]/40 mt-2">
          Este palpite poderá ser feito no dia do jogo.
        </p>
      )}

      {/* Aviso quando torneio não preenchido */}
      {needsTournament && (
        <p className="text-xs text-[#D96D3A]/80 border border-[#CC5723]/25 rounded-md px-3 py-2 mt-3">
          Preencha os <span className="font-bold text-[#D96D3A]">Palpites do Torneio</span> acima antes de enviar palpites de jogo.
        </p>
      )}

      {/* Palpite do usuário quando jogo já tem resultado */}
      {hasResult && existingPrediction && (
        <div className="mt-3 border-t border-[#F0EADD]/10 pt-3">
          <p className="text-[#F0EADD]/40 text-xs uppercase tracking-wider mb-1.5">
            Seu palpite
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[#F0EADD]/70 font-semibold text-base tabular-nums">
              {existingPrediction.home_score_pred} – {existingPrediction.away_score_pred}
            </span>
            {existingPrediction.home_score_pred === game.home_score &&
             existingPrediction.away_score_pred === game.away_score ? (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">
                Placar exato ✓
              </span>
            ) : (
              (() => {
                const realHomePts = game.home_score ?? 0;
                const realAwayPts = game.away_score ?? 0;
                const predHomePts = existingPrediction.home_score_pred;
                const predAwayPts = existingPrediction.away_score_pred;
                const correctWinner =
                  Math.sign(predHomePts - predAwayPts) === Math.sign(realHomePts - realAwayPts);
                return correctWinner ? (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded px-1.5 py-0.5">
                    Resultado certo ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                    Não acertou
                  </span>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Formulário de palpite (jogos futuros) — enviar palpite também dispara o check-in */}
      {(expanded || (existingPrediction && !hasResult)) && !needsTournament && (
        <PredictionForm
          gameId={game.id}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          disabled={isPastDeadline}
          existingPrediction={existingPrediction}
          onSubmitted={() => checkInRef.current?.trigger()}
        />
      )}

      {/* Check-in standalone: disponível no dia do jogo até o kickoff,
          independente do palpite (persiste após palpitar e após o prazo de 5 min) */}
      {checkInOpen && (
        <div className="mt-4">
          <CheckInButton
            ref={checkInRef}
            gameId={game.id}
            restaurantLat={restaurantLat}
            restaurantLng={restaurantLng}
            radiusM={radiusM}
            alreadyCheckedIn={alreadyCheckedIn}
          />
        </div>
      )}
    </Card>
  );
}
