"use client";

import { useState } from "react";
import { selfCheckIn } from "./actions";

interface CheckInButtonProps {
  gameId: string;
  alreadyCheckedIn: boolean;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Status = "idle" | "locating" | "checking" | "success" | "far" | "error" | "done";

export default function CheckInButton({ gameId, alreadyCheckedIn }: CheckInButtonProps) {
  const [status, setStatus] = useState<Status>(alreadyCheckedIn ? "done" : "idle");
  const [message, setMessage] = useState("");

  const restaurantLat = parseFloat(process.env.NEXT_PUBLIC_RESTAURANT_LAT ?? "0");
  const restaurantLng = parseFloat(process.env.NEXT_PUBLIC_RESTAURANT_LNG ?? "0");
  const radiusM = parseInt(process.env.NEXT_PUBLIC_CHECKIN_RADIUS_M ?? "200", 10);

  async function handleCheckIn() {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Geolocalização não suportada neste dispositivo.");
      return;
    }

    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const dist = haversineMeters(
          position.coords.latitude,
          position.coords.longitude,
          restaurantLat,
          restaurantLng
        );

        if (dist > radiusM) {
          setStatus("far");
          setMessage(`Você está a ${Math.round(dist)}m do restaurante. Precisa estar a menos de ${radiusM}m.`);
          return;
        }

        setStatus("checking");
        const result = await selfCheckIn(gameId);

        if (result.success) {
          setStatus("success");
          setMessage("Presença registrada! +51 pontos no ranking.");
        } else {
          setStatus("error");
          setMessage(result.error ?? "Erro ao registrar presença.");
        }
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setMessage("Permissão de localização negada. Habilite nas configurações do browser.");
        } else {
          setMessage("Não foi possível obter sua localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  if (status === "done" || status === "success") {
    return (
      <div className="flex items-center gap-3 bg-[#004600]/40 border border-green-500/30 rounded-sm px-4 py-3 mb-6">
        <span className="text-green-400 text-xl">✓</span>
        <div>
          <p className="text-green-400 text-sm font-bold">Presença confirmada no Merça!</p>
          {status === "success" && (
            <p className="text-[#FAF6EB]/50 text-xs mt-0.5">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleCheckIn}
        disabled={status === "locating" || status === "checking"}
        className="w-full bg-[#004600] hover:bg-[#005700] border border-green-500/40 text-[#F6C900] font-bold py-4 px-6 rounded-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base uppercase tracking-wider"
      >
        {status === "locating" && (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Obtendo localização...
          </>
        )}
        {status === "checking" && "Registrando presença..."}
        {(status === "idle" || status === "far" || status === "error") && (
          <>
            <span>📍</span>
            Estou no Merça!
          </>
        )}
      </button>

      {(status === "far" || status === "error") && (
        <p className="text-red-400 text-xs mt-2 text-center">{message}</p>
      )}

      <p className="text-[#FAF6EB]/30 text-xs text-center mt-2">
        Confirme sua presença no restaurante durante o jogo para ganhar pontos.
      </p>
    </div>
  );
}
