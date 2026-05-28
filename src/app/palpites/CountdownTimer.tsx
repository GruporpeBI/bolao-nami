"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  deadline: Date;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(deadline.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(deadline.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <span className="text-sm font-bold text-red-500 uppercase tracking-wider">
        Encerrado
      </span>
    );
  }

  const totalSecs = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const color =
    remaining < 10 * 60 * 1000
      ? "text-red-500"
      : remaining < 60 * 60 * 1000
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <span className={`text-sm font-bold font-mono tracking-wider ${color}`}>
      {display}
    </span>
  );
}
