import { useCallback, useEffect, useMemo, useState } from 'react';
import { mockTeams } from '../data';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';
import { readStorage, writeStorage } from '../utils/storage';

export type PicklistLane = 'first' | 'second' | 'dnp';
export type PicklistState = Record<PicklistLane, number[]>;

export const PICKLIST_LANES: PicklistLane[] = ['first', 'second', 'dnp'];

export const PICKLIST_LANE_META: Record<PicklistLane, { label: string; short: string; badgeClass: string }> = {
  first: { label: '1st Pick Targets', short: '1st Pick', badgeClass: 'bg-integra-yellow text-[#111111] border-integra-yellow' },
  second: { label: '2nd Pick / Support', short: '2nd Pick', badgeClass: 'bg-sky-500/15 text-sky-500 border-sky-500/40' },
  dnp: { label: 'Do Not Pick', short: 'DNP', badgeClass: 'bg-rose-500/15 text-rose-500 border-rose-500/40' },
};
const STORAGE_KEY = 'integra_picklist_v1';
const EMPTY: PicklistState = { first: [], second: [], dnp: [] };

// Stored data is untrusted: drop unknown teams, the host team and duplicates across lanes.
function sanitize(raw: unknown): PicklistState {
  const known = new Set(mockTeams.map((t) => t.number));
  const seen = new Set<number>();
  const result: PicklistState = { first: [], second: [], dnp: [] };
  if (!raw || typeof raw !== 'object') return result;
  for (const lane of PICKLIST_LANES) {
    const list = (raw as Record<string, unknown>)[lane];
    if (!Array.isArray(list)) continue;
    for (const n of list) {
      if (typeof n === 'number' && known.has(n) && n !== HOST_TEAM_NUMBER && !seen.has(n)) {
        seen.add(n);
        result[lane].push(n);
      }
    }
  }
  return result;
}

function loadPicklist(): PicklistState {
  const raw = readStorage(STORAGE_KEY);
  if (!raw) return EMPTY;
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

export function usePicklist() {
  const [lists, setLists] = useState<PicklistState>(loadPicklist);

  useEffect(() => {
    writeStorage(STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  // Keep several open tabs (e.g. strategist laptop + drive-team tablet) in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLists(loadPicklist());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const laneByTeam = useMemo(() => {
    const map = new Map<number, PicklistLane>();
    for (const lane of PICKLIST_LANES) lists[lane].forEach((n) => map.set(n, lane));
    return map;
  }, [lists]);

  // Moves a team into `lane`, inserted before `beforeTeam` (or appended). Addressing the
  // drop target by team instead of by index avoids off-by-one shifts when reordering
  // within the same lane. A null lane removes the team from the picklist.
  const moveTeam = useCallback(
    (teamNumber: number, lane: PicklistLane | null, beforeTeam: number | null = null) => {
      if (teamNumber === HOST_TEAM_NUMBER) return;
      setLists((prev) => {
        const next: PicklistState = {
          first: prev.first.filter((n) => n !== teamNumber),
          second: prev.second.filter((n) => n !== teamNumber),
          dnp: prev.dnp.filter((n) => n !== teamNumber),
        };
        if (lane) {
          const target = [...next[lane]];
          const idx = beforeTeam === null ? -1 : target.indexOf(beforeTeam);
          target.splice(idx === -1 ? target.length : idx, 0, teamNumber);
          next[lane] = target;
        }
        return next;
      });
    },
    []
  );

  const shiftTeam = useCallback((teamNumber: number, direction: -1 | 1) => {
    setLists((prev) => {
      const lane = PICKLIST_LANES.find((l) => prev[l].includes(teamNumber));
      if (!lane) return prev;
      const list = [...prev[lane]];
      const from = list.indexOf(teamNumber);
      const to = from + direction;
      if (to < 0 || to >= list.length) return prev;
      [list[from], list[to]] = [list[to], list[from]];
      return { ...prev, [lane]: list };
    });
  }, []);

  const clearPicklist = useCallback(() => setLists(EMPTY), []);

  return { lists, laneByTeam, moveTeam, shiftTeam, clearPicklist };
}

export type PicklistApi = ReturnType<typeof usePicklist>;
