"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { syncGamesFromAPI } from "./actions";

export default function SyncButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setStatus("loading");
    const result = await syncGamesFromAPI();
    if (result.success) {
      setStatus("done");
      setMessage(`${result.synced} jogo(s) sincronizado(s).`);
    } else {
      setStatus("error");
      setMessage(result.error ?? "Erro ao sincronizar.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="green"
        size="sm"
        onClick={handleSync}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sincronizando..." : "Sincronizar da API"}
      </Button>
      {message && (
        <span className={`text-sm ${status === "error" ? "text-red-400" : "text-green-400"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
