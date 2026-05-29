"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  target: Date;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer({ target }: CountdownTimerProps) {
  const [diff, setDiff] = useState(Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSecs = Math.floor(diff / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const numCls  = "text-[18px] font-black leading-snug text-[#FAF6EB]";
  const unitCls = "text-[11px] font-bold uppercase ml-[1px] text-[#FAF6EB]/60";
  const sepCls  = "text-[18px] font-black text-[#FAF6EB]/40 mx-[5px]";

  return (
    <div className="flex items-center gap-3">
      {/* Logo Copa */}
      <div className="flex items-center justify-center w-6 h-6 rounded-[4px] bg-[#252525] overflow-hidden flex-shrink-0">
        <img
          src="/api/flag/wc-logo"
          alt="Copa 2026"
          style={{ objectFit: "cover", fontSize: 0, width: "100%", height: "100%" }}
        />
      </div>

      {/* Tempo */}
      <div className="flex items-baseline font-black">
        {days > 0 && (
          <>
            <span className={numCls}>{pad(days)}</span>
            <span className={unitCls}>d</span>
            <span className={sepCls}>:</span>
          </>
        )}
        <span className={numCls}>{pad(hours)}</span>
        <span className={unitCls}>h</span>
        <span className={sepCls}>:</span>
        <span className={numCls}>{pad(minutes)}</span>
        <span className={unitCls}>m</span>
        <span className={sepCls}>:</span>
        <span className={numCls}>{pad(seconds)}</span>
        <span className={unitCls}>s</span>
      </div>
    </div>
  );
}
