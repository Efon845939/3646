import { describe, expect, it } from 'vitest';
import { mockTeams } from './data';
import { getRealMetrics } from './utils/realMetrics';

describe('team dataset', () => {
  it('uses the team number as a unique key', () => {
    expect(new Set(mockTeams.map((t) => t.number)).size).toBe(mockTeams.length);
  });

  it('has contiguous ranks that follow score order', () => {
    mockTeams.forEach((team, i) => expect(team.rank).toBe(i + 1));
    for (let i = 1; i < mockTeams.length; i++) {
      expect(mockTeams[i].score).toBeLessThanOrEqual(mockTeams[i - 1].score);
    }
  });

  it('gives every team a distinct performance profile', () => {
    // Guards against seed collisions like the one that gave #2096 and #4253 identical stats.
    const signatures = mockTeams.map((t) => {
      const s = t.frcStats!;
      return [s.epa.total, s.epa.auto, s.opr, s.dpr, s.record.wins, s.record.losses, s.cycles.avgTeleopCycles].join('|');
    });
    expect(new Set(signatures).size).toBe(mockTeams.length);
  });

  it('keeps EPA components consistent with the total', () => {
    for (const team of mockTeams) {
      const { epa } = team.frcStats!;
      expect(epa.endgame).toBeGreaterThanOrEqual(0);
      expect(Math.abs(epa.auto + epa.teleop + epa.endgame - epa.total)).toBeLessThan(0.25);
    }
  });

  it('keeps #3646 at its place in the source ranking (92 points, #11)', () => {
    const host = mockTeams.find((t) => t.number === 3646)!;
    expect(host.score).toBe(92);
    expect(host.rank).toBe(11);
  });

  it('uses real TBA results for every record and OPR shown', () => {
    for (const team of mockTeams) {
      const real = getRealMetrics(team.number);
      expect(real).not.toBeNull();
      expect([team.frcStats!.record.wins, team.frcStats!.record.losses, team.frcStats!.record.ties]).toEqual(real!.record);
      expect(team.frcStats!.opr).toBe(real!.bestOpr ?? 0);
    }
  });

  it('orders the simulator rating by real scoring power', () => {
    const byOpr = [...mockTeams].sort((a, b) => a.stats.opr - b.stats.opr);
    for (let i = 1; i < byOpr.length; i++) {
      expect(byOpr[i].frcStats!.epa.total).toBeGreaterThanOrEqual(byOpr[i - 1].frcStats!.epa.total);
    }
  });

  it('builds the radar from percentiles within 0–100', () => {
    for (const team of mockTeams) {
      for (const value of Object.values(team.stats)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
    // #1678 had the lowest-looking radar under the old random ratings; real data puts it on top.
    expect(mockTeams.find((t) => t.number === 1678)!.stats.opr).toBe(100);
  });

  it('has no team numbers mangled by the original importer', () => {
    expect(mockTeams.some((t) => t.number === 64294)).toBe(false);
    expect(mockTeams.find((t) => t.number === 6429)?.name).toBe('4th Dimension');
  });
});
