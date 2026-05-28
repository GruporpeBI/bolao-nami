"use client";

import { useEffect, useState } from "react";

const CUP_START = new Date("2026-06-11T16:00:00-03:00");

const GROUPS: [string, [string, number][]][] = [
  ["Group A", [["Mexico", 4781], ["South Africa", 4736], ["South Korea", 4735], ["Czechia", 4714]]],
  ["Group B", [["Canada", 4752], ["Bosnia & Herzegovina", 4479], ["Qatar", 4792], ["Switzerland", 4699]]],
  ["Group C", [["Brazil", 4748], ["Morocco", 4778], ["Haiti", 7229], ["Scotland", 4695]]],
  ["Group D", [["USA", 4724], ["Paraguay", 4789], ["Australia", 4741], ["Türkiye", 4700]]],
  ["Group E", [["Germany", 4711], ["Curaçao", 55827], ["Côte d'Ivoire", 4768], ["Ecuador", 4757]]],
  ["Group F", [["Netherlands", 4705], ["Japan", 4770], ["Sweden", 4688], ["Tunisia", 4729]]],
  ["Group G", [["Belgium", 4717], ["Egypt", 4758], ["Iran", 4766], ["New Zealand", 4784]]],
  ["Group H", [["Spain", 4698], ["Cabo Verde", 4753], ["Saudi Arabia", 4834], ["Uruguay", 4725]]],
  ["Group I", [["France", 4481], ["Senegal", 4739], ["Iraq", 4767], ["Norway", 4475]]],
  ["Group J", [["Argentina", 4819], ["Algeria", 4691], ["Austria", 4718], ["Jordan", 4771]]],
  ["Group K", [["Portugal", 4704], ["DR Congo", 4823], ["Uzbekistan", 4723], ["Colombia", 4820]]],
  ["Group L", [["England", 4713], ["Croatia", 4715], ["Ghana", 4764], ["Panama", 5164]]],
];

const REPEATED = [...GROUPS, ...GROUPS];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function WorldCupTicker() {
  const [cd, setCd] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, CUP_START.getTime() - Date.now());
      setCd({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff / 3600000) % 24)),
        m: pad(Math.floor((diff / 60000) % 60)),
        s: pad(Math.floor((diff / 1000) % 60)),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes wc-ticker { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        .wc-root { position:relative; overflow:hidden; font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .wc-bg { position:absolute; inset:0; display:flex; flex-direction:column; background:rgb(17,21,23); }
        .wc-bg-flex { flex:1; }
        .wc-row {
          position:relative;
          display:flex; align-items:center; flex-direction:row;
          color:rgb(252,252,254);
          box-shadow:inset 0 0 16px 0 rgba(0,0,0,0.5);
          height:40px; overflow:hidden;
        }
        .wc-countdown {
          min-width:260px; display:flex; align-items:center; justify-content:center;
          gap:16px; padding:8px 16px; cursor:default; height:100%;
          transition:background 160ms ease;
        }
        .wc-countdown:hover { background:rgba(255,255,255,0.08); }
        .wc-logo { width:24px; height:24px; display:flex; overflow:hidden; border-radius:4px; background:rgb(23,28,31); flex-shrink:0; }
        .wc-logo img { width:100%; height:100%; object-fit:cover; }
        .wc-time { display:flex; align-items:baseline; font-weight:800; }
        .wc-num { font-size:18px; line-height:1.33; }
        .wc-unit { font-size:12px; text-transform:uppercase; margin-left:1px; }
        .wc-sep { font-size:18px; line-height:1.33; margin:0 6px; }
        .wc-divider { width:1px; height:40px; flex-shrink:0; background:rgb(35,42,46); }
        .wc-marquee { flex:1; overflow:hidden; padding:8px 0; }
        .wc-track {
          display:flex; align-items:center; flex-direction:row;
          width:max-content; gap:32px; padding-left:32px;
          animation:wc-ticker 60s linear infinite;
        }
        .wc-marquee:hover .wc-track { animation-play-state:paused; }
        .wc-item { display:flex; align-items:center; gap:32px; flex-direction:row; }
        .wc-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.32); flex-shrink:0; }
        .wc-card {
          display:flex; align-items:center; gap:16px; flex-direction:row;
          border-radius:8px; padding:4px 8px; cursor:default;
          transition:background 160ms ease;
        }
        .wc-card:hover { background:rgba(255,255,255,0.08); }
        .wc-name {
          max-width:86px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
          font-size:12px; font-weight:800; color:rgb(255,255,255);
        }
        .wc-flags { display:flex; align-items:center; gap:6px; }
        .wc-flag { width:16px; height:16px; object-fit:cover; font-size:0; display:block; }
        @media (max-width:720px) {
          .wc-row { height:auto; flex-direction:column; align-items:stretch; }
          .wc-countdown { min-width:0; }
          .wc-divider { width:100%; height:1px; }
          .wc-marquee { width:100%; }
        }
      `}</style>

      <div className="wc-root">
        {/* Blurred colourful SVG background — exact copy from Sofascore */}
        <div className="wc-bg">
          <div className="wc-bg-flex" />
          <svg width="100%" height="75" viewBox="0 0 498 75" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "blur(30px)", display: "block" }}>
            <path d="M-6.86646e-05 24.8062L-7.14566e-05 -4.98523e-05L55.3333 -4.76837e-05C24.7735 -4.69741e-05 -6.98076e-05 11.1059 -6.86646e-05 24.8062Z" fill="#367EC9"/>
            <path d="M110.667 49.6124H166V24.8062L110.667 24.8062L55.3333 24.8062L55.3333 0C24.7736 0 1.52588e-05 11.1059 1.52588e-05 24.8062L0 49.6124V74.4186C30.5597 74.4186 55.3333 63.3127 55.3333 49.6124H55.3533C85.8923 49.6076 110.648 38.5119 110.667 24.8217V49.6124Z" fill="#A30100"/>
            <path d="M166 -9.75361e-05L55.3332 -0.000101873L55.3332 24.8061L110.667 24.8061L166 24.8061L166 49.6123C166 35.9193 190.759 24.8179 221.297 24.8061C221.309 24.8061 221.321 24.8061 221.333 24.8061C190.774 24.8061 166 13.7002 166 -9.75361e-05Z" fill="#E42323"/>
            <path d="M221.285 24.8063L221.333 24.8063H276.667C276.667 37.6503 254.893 48.2141 226.991 49.4844C225.15 49.5682 223.283 49.6116 221.393 49.6125C221.373 49.6125 221.353 49.6125 221.333 49.6125L221.393 49.6125L276.667 49.6125L332 49.6125V74.4187L276.667 74.4187H221.333L166 74.4187L166 49.6125C166 35.9195 190.747 24.8181 221.285 24.8063Z" fill="#185A2C"/>
            <path d="M166 -4.00543e-05C166 13.7002 190.774 24.8062 221.333 24.8062H276.667C276.667 11.1059 251.893 -4.95911e-05 221.333 -4.95911e-05L166 -4.00543e-05Z" fill="#17963F"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M221.333 -0.000105688C251.893 -0.00010449 276.667 11.1058 276.667 24.8061C276.667 37.6501 254.893 48.2139 226.991 49.4842C225.15 49.568 223.283 49.6114 221.393 49.6123L276.667 49.6123L332 49.6123C332 35.912 356.774 24.8061 387.333 24.8061L387.333 -9.91821e-05L221.333 -0.000105688Z" fill="#7BB3EC"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M60.9888 49.4845C59.1293 49.5691 57.2426 49.6125 55.3334 49.6125C55.3334 63.3128 30.5597 74.4187 -1.52588e-05 74.4187L166 74.4187L166 49.6125L110.667 49.6125L110.667 24.8218C110.649 37.6591 88.8807 48.2151 60.9888 49.4845Z" fill="#E06A00"/>
            <path d="M332 49.6125L387.333 49.6125C387.333 63.3128 412.107 74.4187 442.667 74.4187L332 74.4187L332 49.6125Z" fill="#FFD700"/>
            <path d="M387.333 24.8062C356.774 24.8062 332 35.9121 332 49.6124H387.333C387.333 63.3126 412.107 74.4186 442.667 74.4186V49.6124C442.667 36.7684 420.893 26.2045 392.991 24.9342C391.145 24.8502 389.271 24.8068 387.376 24.8062C387.362 24.8062 387.348 24.8062 387.333 24.8062Z" fill="#BD9511"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M392.991 24.9342C420.893 26.2045 442.667 36.7684 442.667 49.6124L442.667 74.4186L498 74.4186V49.6124C467.44 49.6124 442.667 38.5064 442.667 24.8062L387.376 24.8062C389.271 24.8068 391.144 24.8502 392.991 24.9342Z" fill="#A30100"/>
            <path d="M387.376 24.8061L442.667 24.8061C442.667 38.5064 467.44 49.6123 498 49.6123L498 24.8061C498 11.1093 473.239 0.00556467 442.69 -0.00010135C442.682 -0.00010135 442.674 -0.00010135 442.667 -0.000101351L387.333 -0.000103519L387.333 24.8061L387.376 24.8061Z" fill="#2035A5"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M498 0L498 24.8062C498 11.1094 473.239 0.0056653 442.69 0L498 0Z" fill="#E06A00"/>
          </svg>
        </div>

        {/* Content row */}
        <div className="wc-row">
          {/* Countdown */}
          <div className="wc-countdown">
            <div className="wc-logo">
              <img src="/static/images/tournaments/world-cup-2026-logo.webp" alt="World Cup 2026"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://www.sofascore.com/static/images/tournaments/world-cup-2026-logo.webp"; }} />
            </div>
            <div className="wc-time" aria-label="Contagem regressiva para a Copa do Mundo">
              <span className="wc-num">{cd.d}</span><span className="wc-unit">d</span>
              <span className="wc-sep">:</span>
              <span className="wc-num">{cd.h}</span><span className="wc-unit">h</span>
              <span className="wc-sep">:</span>
              <span className="wc-num">{cd.m}</span><span className="wc-unit">m</span>
              <span className="wc-sep">:</span>
              <span className="wc-num">{cd.s}</span><span className="wc-unit">s</span>
            </div>
          </div>

          <div className="wc-divider" />

          {/* Marquee */}
          <div className="wc-marquee">
            <div className="wc-track">
              {REPEATED.map(([name, teams], i) => (
                <div className="wc-item" key={i}>
                  <div className="wc-dot" />
                  <div className="wc-card">
                    <span className="wc-name">{name}</span>
                    <div className="wc-flags">
                      {teams.map(([alt, id]) => (
                        <img
                          key={id}
                          className="wc-flag"
                          src={`https://img.sofascore.com/api/v1/team/${id}/image`}
                          alt={alt}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
