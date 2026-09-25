import { describe, expect, it } from 'vitest';
import { computeRadarPercentiles, formatRecord, getRealMetrics, RADAR_KEYS, winRateOf } from './realMetrics';

describe('winRateOf', () => {
  it('divides wins by all games played, to one decimal', () => {
    expect(winRateOf([14, 21, 0])).toBe(40);
    expect(winRateOf([2, 1, 0])).toBe(66.7);
  });

  it('returns null when there is no record or no games', () => {
    expect(winRateOf(null)).toBeNull();
    expect(winRateOf([0, 0, 0])).toBeNull();
  });
});

describe('formatRecord', () => {
  it('formats W-L-T and shows a dash when missing', () => {
    expect(formatRecord([8, 7, 0])).toBe('8-7-0');
    expect(formatRecord(null)).toBe('—');
  });
});

describe('computeRadarPercentiles', () => {
  const teams = [3646, 1678, 254999, 6429]; // 254999 has no data at all
  const pct = computeRadarPercentiles(teams);

  it('covers every team and every axis', () => {
    for (const n of teams) {
      for (const key of RADAR_KEYS) expect(pct.get(n)![key]).toBeTypeOf('number');
    }
  });

  it('puts the best team at 100 and a team without data at the bottom', () => {
    expect(pct.get(1678)!.opr).toBe(100);
    expect(pct.get(254999)!.opr).toBe(0);
  });

  it('treats a lower event rank as better', () => {
    const best = Math.min(...[3646, 1678, 6429].map((n) => getRealMetrics(n)!.bestEventRank!));
    const bestTeam = [3646, 1678, 6429].find((n) => getRealMetrics(n)!.bestEventRank === best)!;
    expect(pct.get(bestTeam)!.rnk).toBe(100);
  });
});
