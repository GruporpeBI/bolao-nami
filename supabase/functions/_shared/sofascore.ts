/**
 * Shared Sofascore API helpers for Supabase Edge Functions.
 * Handles proper headers, 403 graceful degradation, and common data shapes.
 */

export const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
export const BRAZIL_TEAM_ID = 4748;
export const WC_TOURNAMENT_ID = 16;

const SOFASCORE_HEADERS = {
  accept: "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  referer: "https://www.sofascore.com/",
  origin: "https://www.sofascore.com",
};

export interface SofascoreEvent {
  id: number;
  slug: string;
  tournament: {
    id: number;
    name: string;
    slug: string;
    uniqueTournament?: {
      id: number;
      name: string;
      slug: string;
    };
  };
  roundInfo?: {
    round?: number;
    name?: string;
    slug?: string;
  };
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
    nameCode?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
    nameCode?: string;
  };
  homeScore?: {
    current?: number;
    period1?: number;
    period2?: number;
    normaltime?: number;
  };
  awayScore?: {
    current?: number;
    period1?: number;
    period2?: number;
    normaltime?: number;
  };
  status?: {
    code?: number;
    type?: string;
    description?: string;
  };
  startTimestamp?: number;
  customId?: string;
}

export interface FetchResult<T> {
  data: T | null;
  status: number;
  error?: string;
}

/**
 * Fetch from Sofascore API with proper headers.
 * Returns a FetchResult — never throws. On 403/non-200, returns null data with the status code.
 */
export async function sofascoreFetch<T = unknown>(
  path: string
): Promise<FetchResult<T>> {
  const url = `${SOFASCORE_BASE}${path}`;
  try {
    const res = await fetch(url, { headers: SOFASCORE_HEADERS });
    if (!res.ok) {
      return {
        data: null,
        status: res.status,
        error: `HTTP ${res.status} from ${url}`,
      };
    }
    const json = (await res.json()) as T;
    return { data: json, status: res.status };
  } catch (err) {
    return {
      data: null,
      status: 0,
      error: `Fetch error for ${url}: ${String(err)}`,
    };
  }
}

/**
 * Fetch all scheduled events for a specific date (YYYY-MM-DD).
 * Returns only World Cup events (uniqueTournament.id === WC_TOURNAMENT_ID).
 */
export async function fetchScheduledEvents(
  date: string
): Promise<{ events: SofascoreEvent[]; error?: string }> {
  const result = await sofascoreFetch<{ events: SofascoreEvent[] }>(
    `/sport/football/scheduled-events/${date}`
  );

  if (!result.data) {
    return { events: [], error: result.error };
  }

  const wcEvents = (result.data.events ?? []).filter(
    (e) => e.tournament?.uniqueTournament?.id === WC_TOURNAMENT_ID
  );

  return { events: wcEvents };
}

/**
 * Fetch live event data for a specific sofascore event ID.
 */
export async function fetchEvent(
  eventId: number
): Promise<FetchResult<{ event: SofascoreEvent }>> {
  return sofascoreFetch<{ event: SofascoreEvent }>(`/event/${eventId}`);
}

/**
 * Fetch statistics for a specific sofascore event ID.
 */
export async function fetchEventStatistics(
  eventId: number
): Promise<FetchResult<{ statistics: unknown[] }>> {
  return sofascoreFetch<{ statistics: unknown[] }>(
    `/event/${eventId}/statistics`
  );
}

// ---------------------------------------------------------------------------
// Filtering helpers
// ---------------------------------------------------------------------------

export function isBrazilMatch(event: SofascoreEvent): boolean {
  return (
    event.homeTeam?.id === BRAZIL_TEAM_ID ||
    event.awayTeam?.id === BRAZIL_TEAM_ID
  );
}

function roundText(event: SofascoreEvent): string {
  return [
    event.roundInfo?.name,
    event.roundInfo?.slug,
    event.tournament?.name,
    event.tournament?.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isSemifinal(event: SofascoreEvent): boolean {
  return roundText(event).includes("semi");
}

export function isFinal(event: SofascoreEvent): boolean {
  const text = roundText(event);
  return (
    text.includes("final") &&
    !text.includes("third") &&
    !text.includes("3rd") &&
    !text.includes("semi")
  );
}

export function isRelevantMatch(event: SofascoreEvent): boolean {
  return isBrazilMatch(event) || isSemifinal(event) || isFinal(event);
}

// ---------------------------------------------------------------------------
// Stage mapping
// ---------------------------------------------------------------------------

export type GameStage =
  | "group"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export function stageFromSofascore(event: SofascoreEvent): GameStage {
  const text = roundText(event);
  if (text.includes("semi")) return "semifinal";
  if (
    text.includes("final") &&
    !text.includes("third") &&
    !text.includes("3rd") &&
    !text.includes("semi")
  ) {
    return "final";
  }
  if (text.includes("quarter")) return "quarterfinal";
  if (
    text.includes("round of 16") ||
    text.includes("last-16") ||
    text.includes("last 16") ||
    text.includes("round-of-16")
  ) {
    return "round_of_16";
  }
  return "group";
}

// ---------------------------------------------------------------------------
// Possession parser
// ---------------------------------------------------------------------------

export function parsePercent(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function findPossession(statisticsPayload: unknown): {
  home: number | null;
  away: number | null;
} {
  const payload = statisticsPayload as {
    statistics?: Array<{
      groups?: Array<{
        statisticsItems?: Array<{
          key?: string;
          name?: string;
          home?: unknown;
          away?: unknown;
        }>;
      }>;
    }>;
  };

  for (const period of payload?.statistics ?? []) {
    for (const group of period.groups ?? []) {
      for (const item of group.statisticsItems ?? []) {
        const key = String(item.key ?? item.name ?? "").toLowerCase();
        if (key.includes("possession") || key.includes("posse")) {
          return {
            home: parsePercent(item.home),
            away: parsePercent(item.away),
          };
        }
      }
    }
  }
  return { home: null, away: null };
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Generate an array of YYYY-MM-DD strings for every day between startDate and endDate (inclusive).
 */
export function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}
