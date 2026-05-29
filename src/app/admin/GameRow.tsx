"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { toggleGameEnabled } from "./actions";
import { teamName } from "@/lib/team-names";

interface GameRowProps {
  game: {
    id: string;
    home_team: string;
    away_team: string;
    stage: string;
    scheduled_at: string;
    is_brazil_game: boolean;
    is_final: boolean;
    is_enabled: boolean;
    external_id: number | null;
  };
}

const stageLabel: Record<string, string> = {
  group: "Grupos",
  round_of_16: "Oitavas",
  quarterfinal: "Quartas",
  semifinal: "Semi",
  final: "Final",
};

export default function GameRow({ game }: GameRowProps) {
  const [enabled, setEnabled] = useState(game.is_enabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const result = await toggleGameEnabled(game.id, !enabled);
    if (result.success) setEnabled((v) => !v);
    setLoading(false);
  }

  const dateStr = new Date(game.scheduled_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <tr className="border-b border-[#F6C900]/10 hover:bg-[#F6C900]/5 transition-colors">
      <td className="py-3 pr-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[#FAF6EB] font-medium text-sm">
            {teamName(game.home_team)} × {teamName(game.away_team)}
          </span>
          <span className="text-[#FAF6EB]/40 text-xs">{dateStr}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <span className="text-[#FAF6EB]/60 text-xs">
          {stageLabel[game.stage] ?? game.stage}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {game.is_brazil_game && <Badge variant="green">Brasil</Badge>}
          {game.is_final && <Badge variant="gold">Final</Badge>}
        </div>
      </td>
      <td className="py-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            enabled ? "bg-[#004600]" : "bg-[#FAF6EB]/20"
          }`}
          aria-label={enabled ? "Desabilitar jogo" : "Habilitar jogo"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </td>
    </tr>
  );
}
