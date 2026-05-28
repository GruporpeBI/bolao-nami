"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updateGameResult } from "./actions";

interface ResultModalProps {
  game: {
    id: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    ball_possession_home: number | null;
  };
}

export default function ResultModal({ game }: ResultModalProps) {
  const [open, setOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(game.home_score?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(game.away_score?.toString() ?? "");
  const [possession, setPossession] = useState(
    game.ball_possession_home?.toString() ?? ""
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hs = parseInt(homeScore);
    const as = parseInt(awayScore);
    const ps = parseInt(possession);

    if (isNaN(hs) || isNaN(as) || isNaN(ps)) {
      setStatus("error");
      setMessage("Preencha todos os campos corretamente.");
      return;
    }

    setStatus("loading");
    const result = await updateGameResult(game.id, hs, as, ps);

    if (result.success) {
      setStatus("success");
      setMessage("Resultado atualizado e pontuações recalculadas.");
      setTimeout(() => setOpen(false), 1500);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao atualizar.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[#F6C900] underline underline-offset-2 hover:text-[#D4A800] transition-colors"
      >
        Editar resultado
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-[#1A1A1A] border border-[#F6C900]/20 rounded-sm p-6 w-full max-w-sm mx-4">
            <h3 className="text-[#F6C900] font-bold text-lg mb-1">
              Editar Resultado
            </h3>
            <p className="text-[#FAF6EB]/50 text-sm mb-6">
              {game.home_team} × {game.away_team}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-end gap-3">
                <Input
                  label={game.home_team}
                  type="number"
                  min={0}
                  max={20}
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20"
                />
                <span className="text-[#F6C900] font-bold text-xl pb-3">×</span>
                <Input
                  label={game.away_team}
                  type="number"
                  min={0}
                  max={20}
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20"
                />
              </div>
              <Input
                label="Posse de bola Casa (%)"
                type="number"
                min={0}
                max={100}
                value={possession}
                onChange={(e) => setPossession(e.target.value)}
              />

              {message && (
                <p className={`text-sm ${status === "error" ? "text-red-400" : "text-green-400"}`}>
                  {message}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
