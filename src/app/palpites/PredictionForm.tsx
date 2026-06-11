"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { submitPrediction } from "./actions";

interface PredictionFormProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  disabled: boolean;
  existingPrediction?: {
    home_score_pred: number;
    away_score_pred: number;
    possession_pred: number;
  } | null;
  onSubmitted?: () => void;
}

function ScoreInput({
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  error?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { onChange(""); return; }
    const n = parseInt(raw, 10);
    if (n > 20) return;
    onChange(String(n)); // remove zeros à esquerda
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#F6C900] uppercase tracking-wider">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0"
        maxLength={2}
        className={`w-20 text-center bg-[#1A1A1A] border ${error ? "border-red-500" : "border-[#F6C900]/30"} text-[#FAF6EB] rounded-sm px-2 py-3 text-xl font-bold outline-none focus:border-[#F6C900] transition-colors placeholder:text-[#FAF6EB]/30 disabled:opacity-50`}
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

function PossessionInput({
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  error?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { onChange(""); return; }
    const n = parseInt(raw, 10);
    if (n > 100) return;
    // Bloqueia 2+ dígitos abaixo de 50 em tempo real (mínimo válido é 50)
    if (raw.length >= 2 && n < 50) return;
    onChange(String(n));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#F6C900] uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="50"
          maxLength={3}
          className={`w-20 text-center bg-[#1A1A1A] border ${error ? "border-red-500" : "border-[#F6C900]/30"} text-[#FAF6EB] rounded-sm px-2 py-3 text-xl font-bold outline-none focus:border-[#F6C900] transition-colors placeholder:text-[#FAF6EB]/30 disabled:opacity-50`}
        />
        <span className="text-[#FAF6EB]/40 text-sm">%</span>
      </div>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

export default function PredictionForm({
  gameId,
  homeTeam,
  awayTeam,
  disabled,
  existingPrediction,
  onSubmitted,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.home_score_pred?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.away_score_pred?.toString() ?? ""
  );
  const [possession, setPossession] = useState(
    existingPrediction?.possession_pred?.toString() ?? ""
  );
  const [possessionTeam, setPossessionTeam] = useState<"home" | "away">("home");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (existingPrediction) {
    return (
      <div className="mt-4 border-t border-[#F6C900]/10 pt-4">
        <p className="text-xs text-[#FAF6EB]/50 uppercase tracking-wider mb-3">Seu palpite</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[#FAF6EB]/70 text-sm">{homeTeam}</span>
            <span className="text-[#F6C900] font-bold text-xl">
              {existingPrediction.home_score_pred} × {existingPrediction.away_score_pred}
            </span>
            <span className="text-[#FAF6EB]/70 text-sm">{awayTeam}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-[#FAF6EB]/40">Posse</span>
            <span className="bg-[#004600] text-[#F6C900] font-bold px-2 py-0.5 rounded-sm text-xs">
              {homeTeam}
            </span>
            <span className="text-[#F6C900] font-bold">{existingPrediction.possession_pred}%</span>
          </div>
        </div>
        <p className="text-xs text-[#FAF6EB]/30 mt-2">Palpite já enviado — não é possível editar.</p>
      </div>
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    const ps = parseInt(possession);
    if (homeScore === "" || isNaN(hs) || hs < 0 || hs > 20) errs.homeScore = "Informe um placar de 0 a 20.";
    if (awayScore === "" || isNaN(as_) || as_ < 0 || as_ > 20) errs.awayScore = "Informe um placar de 0 a 20.";
    if (possession === "" || isNaN(ps) || ps < 50 || ps > 100) errs.possession = "Posse deve ser entre 50% e 100%.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("loading");

    const possessionValue = possessionTeam === "home"
      ? parseInt(possession)
      : 100 - parseInt(possession);

    const result = await submitPrediction(gameId, parseInt(homeScore), parseInt(awayScore), possessionValue);
    if (result.success) {
      setStatus("success");
      setMessage("Palpite enviado com sucesso!");
      // Enviar palpite também dispara o check-in (não bloqueia o palpite se falhar)
      onSubmitted?.();
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao enviar palpite.");
    }
  }

  const isDisabled = disabled || status === "loading" || status === "success";
  const selectedTeamName = possessionTeam === "home" ? homeTeam : awayTeam;

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-[#F6C900]/10 pt-4 flex flex-col gap-5">
      <p className="text-xs text-[#FAF6EB]/50 uppercase tracking-wider">Seu palpite</p>

      {/* Placar */}
      <div className="flex flex-wrap gap-4 items-end">
        <ScoreInput label={homeTeam} value={homeScore} onChange={setHomeScore} disabled={isDisabled} error={errors.homeScore} />
        <span className="text-[#F6C900] font-bold text-2xl pb-3">×</span>
        <ScoreInput label={awayTeam} value={awayScore} onChange={setAwayScore} disabled={isDisabled} error={errors.awayScore} />
      </div>

      {/* Posse de bola */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#F6C900] uppercase tracking-wider">
          Posse de bola (%)
        </span>
        <p className="text-xs text-[#FAF6EB]/40 -mt-1">De qual time você quer prever a posse?</p>

        <div className="flex gap-2">
          {(["home", "away"] as const).map((side) => {
            const name = side === "home" ? homeTeam : awayTeam;
            const active = possessionTeam === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => setPossessionTeam(side)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-sm text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  active
                    ? "bg-[#F6C900] border-[#F6C900] text-[#1A1A1A]"
                    : "bg-transparent border-[#F6C900]/30 text-[#FAF6EB]/60 hover:border-[#F6C900]/60"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <PossessionInput
          label={`Posse do ${selectedTeamName} (mín. 50%)`}
          value={possession}
          onChange={setPossession}
          disabled={isDisabled}
          error={errors.possession}
        />
      </div>

      <Button
        type="submit"
        variant="gold"
        size="sm"
        disabled={isDisabled}
        className="self-start"
      >
        {status === "loading" ? "Enviando..." : "Enviar palpite"}
      </Button>

      {status === "success" && <p className="text-green-400 text-sm">{message}</p>}
      {status === "error" && <p className="text-red-400 text-sm">{message}</p>}
    </form>
  );
}
