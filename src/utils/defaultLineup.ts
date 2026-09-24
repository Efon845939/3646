import { Team, mockTeams } from '../data';

export interface SimLineup {
  blueCaptain: Team;
  bluePick1: Team;
  bluePick2: Team;
  redCaptain: Team;
  redPick1: Team;
  redPick2: Team;
}

// Fills the six field slots with distinct robots: requested captains first, then preferred
// team numbers, then the best-ranked team not yet on the field. Falling back to fixed list
// indexes used to put the same robot on both alliances whenever the list order changed.
export function buildDefaultLineup(teamA?: Team | null, teamB?: Team | null): SimLineup {
  const used = new Set<number>();
  const take = (...candidates: Array<Team | number | null | undefined>): Team => {
    for (const c of candidates) {
      const team = typeof c === 'number' ? mockTeams.find((t) => t.number === c) : c;
      if (team && !used.has(team.number)) {
        used.add(team.number);
        return team;
      }
    }
    const next = mockTeams.find((t) => !used.has(t.number))!;
    used.add(next.number);
    return next;
  };

  const blueCaptain = take(teamA, 3646);
  // Reserve an explicitly requested red captain before blue's default picks can claim it.
  const requestedRed = teamB && teamB.number !== blueCaptain.number ? take(teamB) : null;
  const bluePick1 = take(1678, 6328);
  const bluePick2 = take(498, 118);
  const redCaptain = requestedRed ?? take(254, 4253);
  return {
    blueCaptain,
    bluePick1,
    bluePick2,
    redCaptain,
    redPick1: take(118, 6328),
    redPick2: take(6328, 2096),
  };
}
