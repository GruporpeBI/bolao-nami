import { unstable_cache } from "next/cache";

const BASE_URL = "https://api.football-data.org/v4";

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "SUSPENDED" | "POSTPONED" | "CANCELLED" | "AWARDED";
  matchday: number | null;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  odds?: { msg: string };
  referees: { id: number; name: string; type: string; nationality: string }[];
}

interface FDMatchesResponse {
  filters: Record<string, string>;
  resultSet: { count: number; first: string; last: string; played: number };
  competition: { id: number; name: string; code: string; type: string; emblem: string };
  matches: FDMatch[];
}

interface FDMatchResponse {
  match: FDMatch;
}

async function fetchFromAPI<T>(path: string): Promise<T | null> {
  const token = process.env.FOOTBALL_API_TOKEN;
  if (!token) {
    console.warn("[football-api] FOOTBALL_API_TOKEN not configured");
    return null;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": token },
  });

  if (!res.ok) {
    console.warn(`[football-api] Request failed: ${res.status} ${res.statusText} for ${path}`);
    return null;
  }

  return res.json() as Promise<T>;
}

export const getWorldCupMatches = unstable_cache(
  async (): Promise<FDMatch[]> => {
    const data = await fetchFromAPI<FDMatchesResponse>("/competitions/WC/matches");
    if (!data) return [];
    return data.matches;
  },
  ["wc-matches"],
  { revalidate: 60, tags: ["wc-matches"] }
);

export async function getMatchById(id: number): Promise<FDMatch | null> {
  const data = await fetchFromAPI<FDMatchResponse>(`/matches/${id}`);
  if (!data) return null;
  return data.match;
}

export async function getBrazilMatches(): Promise<FDMatch[]> {
  const matches = await getWorldCupMatches();
  return matches.filter(
    (m) =>
      m.homeTeam.tla === "BRA" ||
      m.awayTeam.tla === "BRA" ||
      m.homeTeam.shortName === "Brazil" ||
      m.awayTeam.shortName === "Brazil"
  );
}
