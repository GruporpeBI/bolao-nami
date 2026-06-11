"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";

interface ScoreRow {
  user_id: string;
  user_name: string;
  attendance_pts: number;
  result_pts: number;
  exact_score_pts: number;
  tournament_pts: number;
  total_pts: number;
  updated_at: string;
  poss_team_correct: number;
  poss_proximity: number;
}

interface GameRankingEntry {
  user_id: string;
  user_name: string;
  home_pred: number;
  away_pred: number;
  pts: number;
  poss_team_correct: number;
  poss_proximity: number;
  attendance_pts: number;
  checkedIn: boolean;
  possessionPred: number | null;
}

interface GameRanking {
  gameId: string;
  label: string;
  scheduledAt: string;
  home_score: number | null;
  away_score: number | null;
  homeTeam: string;
  awayTeam: string;
  ballPossessionHome: number | null;
  livePossessionHome: number | null;
  isLive: boolean;
  entries: GameRankingEntry[];
}

interface RankingTableProps {
  initialData: ScoreRow[];
  gameRankings: GameRanking[];
}

const medalColors = [
  "bg-[#CC5723] text-white",
  "bg-[#C0C0C0] text-[#1A0C04]",
  "bg-[#CD7F32] text-[#F0EADD]",
];
const medalEmojis = ["🥇", "🥈", "🥉"];

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function ptsLabel(pts: number): string {
  if (pts === 30 || pts === 121) return "Placar exato";
  if (pts === 16) return "Acertou Ganhador";
  if (pts === 0) return "Errou";
  return `${pts} pts`;
}

// Palpite de posse de bola → mostra o time majoritário + % (padrão do app)
function possessionLabel(pred: number | null, homeTeam: string, awayTeam: string): string {
  if (pred == null) return "—";
  if (pred > 50) return `${homeTeam} ${pred}%`;
  if (pred < 50) return `${awayTeam} ${100 - pred}%`;
  return "50%";
}

export default function RankingTable({ initialData, gameRankings }: RankingTableProps) {
  const router = useRouter();
  const [data, setData] = useState<ScoreRow[]>(initialData);

  // Jogo em andamento → abre o "Ranking por Jogo" como aba primária
  const liveGame = gameRankings.find((g) => g.isLive) ?? null;
  const [tab, setTab] = useState<"geral" | "jogo">(liveGame ? "jogo" : "geral");
  const [selectedGame, setSelectedGame] = useState<string>(
    liveGame?.gameId ?? gameRankings[0]?.gameId ?? ""
  );

  // Atualiza dados do servidor a cada 60 segundos (ranking por jogo + geral)
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  // Quando um jogo ENTRA ao vivo (após carregar a página), abre o ranking dele.
  // Só age na transição → não força o usuário caso ele troque manualmente depois.
  const prevLiveRef = useRef<string | null>(liveGame?.gameId ?? null);
  useEffect(() => {
    const currentLive = gameRankings.find((g) => g.isLive)?.gameId ?? null;
    if (currentLive && currentLive !== prevLiveRef.current) {
      setTab("jogo");
      setSelectedGame(currentLive);
    }
    prevLiveRef.current = currentLive;
  }, [gameRankings]);

  // Realtime para ranking geral (atualizações imediatas via Supabase)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("scores-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        (payload) => {
          setData((prev) => {
            const sortAll = (rows: ScoreRow[]) =>
              rows
                .sort((a, b) => {
                  if (b.total_pts !== a.total_pts)                 return b.total_pts - a.total_pts;
                  if (b.attendance_pts !== a.attendance_pts)       return b.attendance_pts - a.attendance_pts;
                  if (b.exact_score_pts !== a.exact_score_pts)     return b.exact_score_pts - a.exact_score_pts;
                  if (b.result_pts !== a.result_pts)               return b.result_pts - a.result_pts;
                  return b.poss_team_correct - a.poss_team_correct;
                })
                .slice(0, 10);

            if (payload.eventType === "INSERT") {
              const newRow = { ...(payload.new as ScoreRow), poss_team_correct: 0, poss_proximity: 9999 };
              return sortAll([...prev, newRow]);
            }
            if (payload.eventType === "UPDATE") {
              return sortAll(
                prev.map((row) =>
                  row.user_id === (payload.new as ScoreRow).user_id
                    ? { ...row, ...(payload.new as ScoreRow), poss_team_correct: row.poss_team_correct, poss_proximity: row.poss_proximity }
                    : row
                )
              );
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const top3 = data.slice(0, 3);
  const currentGameRanking = gameRankings.find((g) => g.gameId === selectedGame);

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-[#CC5723]/20 mb-8">
        <button
          onClick={() => setTab("geral")}
          className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            tab === "geral"
              ? "border-[#CC5723] text-[#CC5723]"
              : "border-transparent text-[#F0EADD]/50 hover:text-[#F0EADD]"
          }`}
        >
          Ranking Geral
        </button>
        {gameRankings.length > 0 && (
          <button
            onClick={() => setTab("jogo")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              tab === "jogo"
                ? "border-[#CC5723] text-[#CC5723]"
                : "border-transparent text-[#F0EADD]/50 hover:text-[#F0EADD]"
            }`}
          >
            Ranking por Jogo
            {liveGame && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          </button>
        )}
      </div>

      {/* ── RANKING GERAL ── */}
      {tab === "geral" && (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {top3.map((row, i) => (
                <div
                  key={row.user_id}
                  className={`rounded-xl p-5 flex flex-col items-center gap-2 border ${
                    i === 0
                      ? "border-[#CC5723] bg-[#CC5723]/10"
                      : i === 1
                      ? "border-[#C0C0C0] bg-[#C0C0C0]/10"
                      : "border-[#CD7F32] bg-[#CD7F32]/10"
                  }`}
                >
                  <span className="text-3xl">{medalEmojis[i]}</span>
                  <span className="text-[#F0EADD] font-bold text-lg text-center">
                    {maskName(row.user_name)}
                  </span>
                  <span className={`font-[var(--font-cond)] text-2xl font-black ${
                    i === 0 ? "text-[#D96D3A]" : i === 1 ? "text-[#C0C0C0]" : "text-[#CD7F32]"
                  }`}>
                    {row.total_pts} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#CC5723]/20 text-[#F0EADD]/50 text-xs uppercase tracking-wider">
                  <th className="py-3 text-left w-10">#</th>
                  <th className="py-3 text-left">Participante</th>
                  <th className="py-3 text-right">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  const position = idx + 1;
                  return (
                    <tr
                      key={row.user_id}
                      className="border-b border-[#CC5723]/10 hover:bg-[#CC5723]/5 transition-colors"
                    >
                      <td className="py-3.5">
                        {position <= 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${medalColors[position - 1]}`}>
                            {position}
                          </span>
                        ) : (
                          <span className="text-[#F0EADD]/40 font-mono text-xs pl-1">{position}</span>
                        )}
                      </td>
                      <td className="py-3.5 text-[#F0EADD] font-medium">{maskName(row.user_name)}</td>
                      <td className="py-3.5 text-right text-[#CC5723] font-bold text-base">{row.total_pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── RANKING POR JOGO ── */}
      {tab === "jogo" && (
        <div>
          {gameRankings.length > 1 && (
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="mb-6 bg-[#251008] border border-[#CC5723]/20 text-[#F0EADD] rounded-sm px-4 py-2 text-sm outline-none focus:border-[#CC5723]"
            >
              {gameRankings.map((g) => (
                <option key={g.gameId} value={g.gameId}>{g.label}</option>
              ))}
            </select>
          )}

          {currentGameRanking && (
            <>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-[#F0EADD]">{currentGameRanking.label}</h2>
                  <span className="text-[#F0EADD]/40 text-xs">
                    {new Date(currentGameRanking.scheduledAt).toLocaleDateString("pt-BR", {
                      weekday: "short", day: "2-digit", month: "2-digit",
                    })}{" "}
                    às{" "}
                    {new Date(currentGameRanking.scheduledAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {currentGameRanking.home_score !== null ? (
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#CC5723] font-black text-xl">
                        {currentGameRanking.home_score} × {currentGameRanking.away_score}
                      </span>
                      {currentGameRanking.isLive ? (
                        <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          Ao vivo
                        </span>
                      ) : (
                        <Badge variant="green">Resultado final</Badge>
                      )}
                    </div>
                    {(() => {
                      // Ao vivo → posse informativa (live); encerrado → posse oficial.
                      const hp = currentGameRanking.isLive
                        ? currentGameRanking.livePossessionHome
                        : currentGameRanking.ballPossessionHome;
                      // 0/100/null = sem dado de posse → não exibe
                      if (hp == null || hp <= 0 || hp >= 100) return null;
                      const team = hp > 50 ? currentGameRanking.homeTeam
                                 : hp < 50 ? currentGameRanking.awayTeam
                                 : null;
                      const pct  = hp > 50 ? hp : 100 - hp;
                      return (
                        <span className="text-[#F0EADD]/50 text-xs">
                          Posse de bola: {team ? `${team} ${pct}%` : "50% / 50%"}
                          {currentGameRanking.isLive && <span className="text-[#F0EADD]/30"> · ao vivo</span>}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <Badge variant="dark">Aguardando resultado</Badge>
                )}
              </div>

              {currentGameRanking.entries.length === 0 ? (
                <p className="text-[#F0EADD]/40 text-sm py-8 text-center">
                  Nenhum palpite registrado para este jogo ainda.
                </p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#CC5723]/20 text-[#F0EADD]/50 text-xs uppercase tracking-wider">
                      <th className="py-3 text-left w-10">#</th>
                      <th className="py-3 text-left">Participante</th>
                      <th className="py-3 text-center">Palpite</th>
                      <th className="py-3 text-center">Posse de Bola</th>
                      <th className="py-3 text-center">Check-in</th>
                      <th className="py-3 text-right">Pontos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGameRanking.entries.map((entry, idx) => (
                      <tr
                        key={entry.user_id}
                        className="border-b border-[#CC5723]/10 hover:bg-[#CC5723]/5 transition-colors"
                      >
                        <td className="py-3.5">
                          {idx < 3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${medalColors[idx]}`}>
                              {idx + 1}
                            </span>
                          ) : idx === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-green-600 text-white">
                              {idx + 1}
                            </span>
                          ) : idx === 4 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-red-600 text-white">
                              {idx + 1}
                            </span>
                          ) : (
                            <span className="text-[#F0EADD]/40 font-mono text-xs pl-1">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 text-[#F0EADD] font-medium">{maskName(entry.user_name)}</td>
                        <td className="py-3.5 text-center font-bold text-[#F0EADD]/80">
                          {entry.home_pred} × {entry.away_pred}
                        </td>
                        <td className="py-3.5 text-center text-[#F0EADD]/70 text-xs">
                          {possessionLabel(entry.possessionPred, currentGameRanking.homeTeam, currentGameRanking.awayTeam)}
                        </td>
                        <td className="py-3.5 text-center">
                          {entry.checkedIn ? (
                            <span className="text-green-400 font-bold text-xs uppercase">Sim</span>
                          ) : (
                            <span className="text-[#F0EADD]/30 font-bold text-xs uppercase">Não</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {currentGameRanking.home_score === null ? (
                            <span className="text-[#F0EADD]/30 text-xs">Aguardando</span>
                          ) : (
                            <>
                              <span className={`font-bold ${entry.pts > 0 ? "text-[#CC5723]" : "text-[#F0EADD]/30"}`}>
                                {entry.pts > 0 ? `+${entry.pts}` : "0"}
                              </span>
                              <span className="text-[#F0EADD]/30 text-xs ml-1">{ptsLabel(entry.pts)}</span>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
