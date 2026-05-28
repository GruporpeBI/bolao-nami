import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres:hyahTpLHam76v9xV@db.yzbsahubleskqbfmvmei.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const stageMap = {
  GROUP_STAGE: "group",
  LAST_16: "round_of_16",
  QUARTER_FINALS: "quarterfinal",
  SEMI_FINALS: "semifinal",
  FINAL: "final",
};

const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
  headers: { "X-Auth-Token": "f71f3f3c7aa2497484d359ebdc28044b" },
});
const data = await res.json();
const matches = (data.matches || []).filter(
  (m) =>
    m.homeTeam?.tla === "BRA" || m.awayTeam?.tla === "BRA" ||
    m.homeTeam?.shortName === "Brazil" || m.awayTeam?.shortName === "Brazil" ||
    m.stage === "FINAL" || m.stage === "SEMI_FINALS"
);

const client = await pool.connect();
try {
  for (const m of matches) {
    const isBrazil =
      m.homeTeam?.tla === "BRA" || m.awayTeam?.tla === "BRA" ||
      m.homeTeam?.shortName === "Brazil" || m.awayTeam?.shortName === "Brazil";
    const isFinal = m.stage === "FINAL";
    const stage = stageMap[m.stage] || "group";

    await client.query(
      `INSERT INTO games (external_id, home_team, away_team, stage, scheduled_at,
        home_score, away_score, ball_possession_home, is_brazil_game, is_final, is_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (external_id) DO UPDATE SET
         home_team=EXCLUDED.home_team, away_team=EXCLUDED.away_team,
         stage=EXCLUDED.stage, scheduled_at=EXCLUDED.scheduled_at,
         is_brazil_game=EXCLUDED.is_brazil_game, is_final=EXCLUDED.is_final`,
      [
        m.id,
        m.homeTeam?.name || "A definir",
        m.awayTeam?.name || "A definir",
        stage,
        m.utcDate,
        m.score?.fullTime?.home ?? null,
        m.score?.fullTime?.away ?? null,
        null,
        isBrazil,
        isFinal,
        isBrazil,
      ]
    );
    console.log("OK:", stage, m.homeTeam?.shortName || "?", "x", m.awayTeam?.shortName || "?", "| enabled:", isBrazil);
  }
  console.log("\nTotal inserido:", matches.length, "jogos");
} finally {
  client.release();
  await pool.end();
}
