import { describe, expect, it } from 'vitest';
import { mockTeams, getEnhancedTeamStats } from './data';

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

  it('prefers curated stats over procedural ones', () => {
    expect(mockTeams.find((t) => t.number === 3646)!.frcStats!.epa.total).toBe(54.2);
  });

  it('precomputes exactly what the deterministic generator returns', () => {
    for (const team of mockTeams) {
      expect(team.frcStats).toEqual(getEnhancedTeamStats(team));
    }
  });
});
