import React, { useState, useMemo } from 'react';
import { Team } from '../data';
import { PICKLIST_LANE_META, PicklistLane } from '../hooks/usePicklist';
import { ArrowUpDown, Scale, Swords, CheckSquare } from 'lucide-react';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';
import { formatRecord, getRealMetrics, winRateOf } from '../utils/realMetrics';

interface TeamTableViewProps {
  teams: Team[];
  selectedCompareTeams: Team[];
  onToggleCompare: (team: Team) => void;
  onSelectTeam: (team: Team) => void;
  onOpenSimulator: (team: Team) => void;
  laneByTeam?: Map<number, PicklistLane>;
}

type TableSortKey = 'rank' | 'number' | 'score' | 'opr' | 'winRate' | 'bestRank' | 'awards';

interface Row {
  team: Team;
  opr: number | null;
  record: [number, number, number] | null;
  winRate: number | null;
  bestRank: number | null;
  awards: number | null;
}

// Keys where a smaller number is better, so their first click sorts ascending.
const LOWER_IS_BETTER: TableSortKey[] = ['rank', 'bestRank', 'number'];

export function TeamTableView({
  teams,
  selectedCompareTeams,
  onToggleCompare,
  onSelectTeam,
  onOpenSimulator,
  laneByTeam,
}: TeamTableViewProps) {
  const [sortKey, setSortKey] = useState<TableSortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo<Row[]>(
    () =>
      teams.map((team) => {
        const real = getRealMetrics(team.number);
        return {
          team,
          opr: real?.bestOpr ?? null,
          record: real?.record ?? null,
          winRate: winRateOf(real?.record ?? null),
          bestRank: real?.bestEventRank ?? null,
          awards: real?.awards2026 ?? null,
        };
      }),
    [teams]
  );

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(LOWER_IS_BETTER.includes(key));
    }
  };

  const sortedRows = useMemo(() => {
    const valueOf = (r: Row): number | null => {
      switch (sortKey) {
        case 'rank':
          return r.team.rank;
        case 'number':
          return r.team.number;
        case 'score':
          return r.team.score;
        default:
          return r[sortKey];
      }
    };
    // Missing values always sink to the bottom, whichever direction is chosen.
    return [...rows].sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortAsc ? va - vb : vb - va;
    });
  }, [rows, sortKey, sortAsc]);

  const SortHeader = ({ colKey, label, tooltip, align = 'right' }: { colKey: TableSortKey; label: string; tooltip?: string; align?: 'left' | 'right' }) => (
    <th
      onClick={() => handleSort(colKey)}
      aria-sort={sortKey === colKey ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      className={`py-3.5 px-3 cursor-pointer select-none text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-colors ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      title={tooltip || `Sort by ${label}`}
    >
      <span className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span>{label}</span>
        <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === colKey ? 'text-accent opacity-100' : 'opacity-30'}`} />
      </span>
    </th>
  );

  return (
    <div className="w-full bg-surface border border-border-main rounded-2xl overflow-hidden shadow-lg">
      {/* The scroll container owns the sticky header, so column labels stay visible across all rows. */}
      <div className="overflow-auto max-h-[calc(100vh-12rem)]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-bg-dark border-b border-border-main shadow-sm">
              <th className="py-3.5 px-3 w-12" aria-label="Compare" />
              <SortHeader colKey="rank" label="Rank" align="left" />
              <SortHeader colKey="number" label="Team" align="left" />
              <SortHeader colKey="score" label="Pre-PR" tooltip="Pre-PR Impact ranking score" />
              <SortHeader colKey="opr" label="Best OPR" tooltip="Best 2026 event OPR (from qualification match scores)" />
              <th className="py-3.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted">Record</th>
              <SortHeader colKey="winRate" label="Win %" tooltip="2026 official win rate" />
              <SortHeader colKey="bestRank" label="Best Rank" tooltip="Best qualification rank at a 2026 event" />
              <SortHeader colKey="awards" label="Awards" tooltip="Awards won at 2026 events" />
              <th className="py-3.5 px-3 w-16" aria-label="Simulate" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/60 text-sm">
            {sortedRows.map(({ team, opr, record, winRate, bestRank, awards }) => {
              const isSelected = selectedCompareTeams.some((t) => t.number === team.number);
              const lane = laneByTeam?.get(team.number);

              return (
                <tr
                  key={team.number}
                  onClick={() => onSelectTeam(team)}
                  className={`hover:bg-surface-hover transition-colors cursor-pointer group ${isSelected ? 'bg-integra-yellow/5' : ''}`}
                >
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(team);
                      }}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? `Remove #${team.number} from compare` : `Add #${team.number} to compare`}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected ? 'text-accent' : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                    </button>
                  </td>

                  <td className="py-3.5 px-3 font-mono font-bold text-text-muted">#{team.rank}</td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-black font-montserrat text-lg px-1.5 rounded ${
                          team.number === HOST_TEAM_NUMBER ? 'bg-integra-yellow text-[#111111]' : 'text-text-main'
                        }`}
                      >
                        #{team.number}
                      </span>
                      <span className="font-semibold text-text-main group-hover:text-accent transition-colors truncate max-w-[260px]">
                        {team.name}
                      </span>
                      {lane && (
                        <span className={`text-xs px-2 py-0.5 rounded-md border font-bold uppercase shrink-0 ${PICKLIST_LANE_META[lane].badgeClass}`}>
                          {PICKLIST_LANE_META[lane].short}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-bold text-text-main">{team.score}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-accent">{opr ?? '—'}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-text-main">{formatRecord(record)}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-text-main">{winRate === null ? '—' : `${winRate}%`}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-text-main">{bestRank === null ? '—' : `#${bestRank}`}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-text-main">{awards ?? '—'}</td>

                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(team)}
                      className="px-2.5 py-1.5 rounded-lg bg-bg-dark hover:bg-surface-hover text-accent border border-integra-yellow/40 hover:border-integra-yellow transition-colors text-xs font-bold uppercase inline-flex items-center gap-1.5"
                      title="Simulate a match against this team"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Sim
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
