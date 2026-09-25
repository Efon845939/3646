import { describe, expect, it } from 'vitest';
import { buildDefaultLineup, SimLineup } from './defaultLineup';
import { mockTeams } from '../data';

const teamNumbers = (lineup: SimLineup) => Object.values(lineup).map((t) => t.number);
const team = (n: number) => mockTeams.find((t) => t.number === n)!;

describe('buildDefaultLineup', () => {
  it('keeps the classic default blue alliance', () => {
    const lineup = buildDefaultLineup();
    expect([lineup.blueCaptain, lineup.bluePick1, lineup.bluePick2].map((t) => t.number)).toEqual([3646, 1678, 498]);
  });

  it('honours the requested captains', () => {
    const lineup = buildDefaultLineup(team(1678), team(498));
    expect(lineup.blueCaptain.number).toBe(1678);
    expect(lineup.redCaptain.number).toBe(498);
  });

  it('never puts the same robot on the field twice, whoever is requested', () => {
    for (const a of mockTeams) {
      for (const b of [mockTeams[0], mockTeams[5], a]) {
        expect(new Set(teamNumbers(buildDefaultLineup(a, b))).size).toBe(6);
      }
    }
  });
});
