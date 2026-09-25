import type { FRCPerformanceStats } from './frcStatsData';
import metricsFile from '../generated/team-metrics-2026.json';

// Real 2026 results collected from The Blue Alliance by scripts/fetch-tba.mjs and compacted by
// scripts/build-team-metrics.mjs. Nothing in this file is estimated except where noted.

export interface RealEvent {
  key: string;
  name: string;
  rank: number | null;
  record: [number, number, number];
  opr: number | null;
  awards: string[];
  playoff: string | null;
}

export interface RealImpactAward {
  year: number;
  event: string;
  name: string;
}

export interface RealTeamMetrics {
  location: string | null;
  rookieYear: number | null;
  record: [number, number, number] | null;
  pool: { name: string; rank: number; points: number } | null;
  bestOpr: number | null;
  bestEventRank: number | null;
  awards2026: number;
  eventWins2026: number;
  impactWins: number;
  impactWin2026: boolean;
  totalAwards: number;
  events: RealEvent[];
  impactHistory: RealImpactAward[];
}

export const REAL_DATA_YEAR = metricsFile.year;
export const REAL_DATA_FETCHED_AT = metricsFile.fetchedAt;
const TEAMS = metricsFile.teams as unknown as Record<string, RealTeamMetrics>;

export function getRealMetrics(teamNumber: number): RealTeamMetrics | null {
  return TEAMS[teamNumber] ?? null;
}

export function winRateOf(record: [number, number, number] | null): number | null {
  if (!record) return null;
  const games = record[0] + record[1] + record[2];
  return games ? Math.round((record[0] / games) * 1000) / 10 : null;
}

export const formatRecord = (record: [number, number, number] | null) =>
  record ? `${record[0]}-${record[1]}-${record[2]}` : '—';

// Radar axes, all derived from real data. Each is shown as a percentile within this team list.
export const RADAR_KEYS = ['win', 'opr', 'rnk', 'awd', 'imp', 'exp'] as const;
export type RadarKey = (typeof RADAR_KEYS)[number];

function axisValue(key: RadarKey, m: RealTeamMetrics | null): number | null {
  if (!m) return null;
  switch (key) {
    case 'win':
      return winRateOf(m.record);
    case 'opr':
      return m.bestOpr;
    case 'rnk':
      return m.bestEventRank === null ? null : -m.bestEventRank; // a lower rank is better
    case 'awd':
      return m.awards2026;
    case 'imp':
      return m.impactWins;
    case 'exp':
      return m.rookieYear === null ? null : REAL_DATA_YEAR - m.rookieYear + 1;
  }
}

/**
 * Percentile rank (0–100) of every team on every axis: the share of the other teams it beats,
 * counting ties as half. Teams with no value for an axis sit at the bottom of it.
 */
export function computeRadarPercentiles(teamNumbers: number[]): Map<number, Record<RadarKey, number>> {
  const result = new Map<number, Record<RadarKey, number>>(
    teamNumbers.map((n) => [n, {} as Record<RadarKey, number>])
  );
  const others = Math.max(1, teamNumbers.length - 1);
  for (const key of RADAR_KEYS) {
    const values = teamNumbers.map((n) => axisValue(key, getRealMetrics(n)) ?? Number.NEGATIVE_INFINITY);
    teamNumbers.forEach((n, i) => {
      const v = values[i];
      let below = 0;
      let equal = -1; // exclude the team itself
      for (const other of values) {
        if (other < v) below++;
        else if (other === v) equal++;
      }
      result.get(n)![key] = Math.round(((below + equal / 2) / others) * 100);
    });
  }
  return result;
}

/**
 * Replaces invented performance numbers with real ones: season record and best-event OPR come
 * straight from TBA. `epa` is kept only as the simulator's internal rating, on the 30–59 scale
 * its scoring model was tuned for, ordered by each team's real OPR percentile.
 */
export function applyRealStats(
  modelled: FRCPerformanceStats,
  real: RealTeamMetrics | null,
  oprPercentile: number
): FRCPerformanceStats {
  if (!real) return modelled;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const total = round1(30 + oprPercentile * 0.29);
  const scale = modelled.epa.total > 0 ? total / modelled.epa.total : 1;
  const auto = round1(modelled.epa.auto * scale);
  const teleop = round1(modelled.epa.teleop * scale);
  const [wins, losses, ties] = real.record ?? [0, 0, 0];

  return {
    ...modelled,
    epa: { total, auto, teleop, endgame: round1(total - auto - teleop), percentile: oprPercentile },
    opr: real.bestOpr ?? 0,
    record: { wins, losses, ties, winRate: winRateOf(real.record) ?? 0 },
  };
}
