"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { selfCheckIn } from "./actions";

export interface CheckInHandle {
  trigger: () => void;
}

interface CheckInButtonProps {
  gameId: string;
  restaurantLat: number;
  restaurantLng: number;
  radiusM: number;
  alreadyCheckedIn?: boolean;
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

type Status = "idle" | "locating" | "checking" | "success" | "far" | "error";

const CheckInButton = forwardRef<CheckInHandle, CheckInButtonProps>(function CheckInButton(
  { gameId, restaurantLat, restaurantLng, radiusM, alreadyCheckedIn = false },
  ref
) {
  const [status, setStatus] = useState<Status>(alreadyCheckedIn ? "success" : "idle");
  const [message, setMessage] = useState("");

  function handleCheckIn() {
    // Evita disparo duplo (ex.: botão + envio de palpite ao mesmo tempo) e após concluído
    if (status === "locating" || status === "checking" || status === "success") return;

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
          setMessage(`Você está a ${Math.round(dist)}m do Nami. Precisa estar a menos de ${radiusM}m.`);
          return;
        }
        setStatus("checking");
        const result = await selfCheckIn(gameId);
        if (result.success) {
          setStatus("success");
          setMessage("");
        } else {
          setStatus("error");
          setMessage(result.error ?? "Erro ao registrar presença.");
        }
      },
      (err) => {
        setStatus("error");
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Habilite nas configurações do browser."
            : "Não foi possível obter sua localização. Tente novamente."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  useImperativeHandle(ref, () => ({ trigger: handleCheckIn }), [status]);

  // Concluído → selo fixo, sem botão
  if (status === "success") {
    return (
      <div className="border-t border-[#F0EADD]/10 pt-4 mt-1 flex items-center gap-2">
        <span className="text-green-400 text-lg">✓</span>
        <span className="text-green-400 text-sm font-bold">
          Sua presença foi confirmada, você ganhou pontos
        </span>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F0EADD]/10 pt-4 mt-1 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckIn}
        disabled={status === "locating" || status === "checking"}
        className="flex items-center justify-center gap-2 w-full border border-[#CC5723]/50 bg-[#CC5723] hover:bg-[#D96D3A] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
      >
        {status === "locating" ? (
          "Obtendo localização..."
        ) : status === "checking" ? (
          "Registrando presença..."
        ) : (
          <>
            <span>📍</span>
            Faça check-in para subir pontuação
          </>
        )}
      </button>
      <p className="text-[#F0EADD]/30 text-xs text-center">
        Check-in válido para presentes no Nami
      </p>
      {(status === "far" || status === "error") && (
        <p className="text-red-400 text-xs text-center">{message}</p>
      )}
    </div>
  );
});

export default CheckInButton;
