import React, { useState, useMemo } from 'react';
import { Team, getEnhancedTeamStats } from '../data';
import { ArrowUpDown, Scale, Swords, CheckSquare, Eye, ExternalLink } from 'lucide-react';

interface TeamTableViewProps {
  teams: Team[];
  selectedCompareTeams: Team[];
  onToggleCompare: (team: Team) => void;
  onSelectTeam: (team: Team) => void;
  onOpenSimulator: (team: Team) => void;
}

type TableSortKey =
  | 'rank'
  | 'number'
  | 'score'
  | 'epa_total'
  | 'epa_auto'
  | 'epa_teleop'
  | 'opr'
  | 'dpr'
  | 'winRate'
  | 'cycles';

export function TeamTableView({
  teams,
  selectedCompareTeams,
  onToggleCompare,
  onSelectTeam,
  onOpenSimulator,
}: TeamTableViewProps) {
  const [sortKey, setSortKey] = useState<TableSortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const teamsWithStats = useMemo(() => {
    return teams.map((team) => ({
      team,
      stats: team.frcStats || getEnhancedTeamStats(team),
    }));
  }, [teams]);

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedTeams = useMemo(() => {
    const list = [...teamsWithStats];
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortKey) {
        case 'rank':
          valA = a.team.rank;
          valB = b.team.rank;
          break;
        case 'number':
          valA = a.team.number;
          valB = b.team.number;
          break;
        case 'score':
          valA = a.team.score;
          valB = b.team.score;
          break;
        case 'epa_total':
          valA = a.stats.epa.total;
          valB = b.stats.epa.total;
          break;
        case 'epa_auto':
          valA = a.stats.epa.auto;
          valB = b.stats.epa.auto;
          break;
        case 'epa_teleop':
          valA = a.stats.epa.teleop;
          valB = b.stats.epa.teleop;
          break;
        case 'opr':
          valA = a.stats.opr;
          valB = b.stats.opr;
          break;
        case 'dpr':
          valA = a.stats.dpr;
          valB = b.stats.dpr;
          break;
        case 'winRate':
          valA = a.stats.record.winRate;
          valB = b.stats.record.winRate;
          break;
        case 'cycles':
          valA = a.stats.cycles.avgTeleopCycles;
          valB = b.stats.cycles.avgTeleopCycles;
          break;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
    return list;
  }, [teamsWithStats, sortKey, sortAsc]);

  const SortHeader = ({
    colKey,
    label,
    tooltip,
    className = '',
  }: {
    colKey: TableSortKey;
    label: string;
    tooltip?: string;
    className?: string;
  }) => (
    <th
      onClick={() => handleSort(colKey)}
      className={`py-3 px-3 cursor-pointer select-none text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-colors ${className}`}
      title={tooltip || `Sort by ${label}`}
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <ArrowUpDown
          className={`w-3 h-3 ${sortKey === colKey ? 'text-integra-yellow opacity-100' : 'opacity-30'}`}
        />
      </div>
    </th>
  );

  return (
    <div className="w-full bg-surface border border-border-main rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-dark/90 border-b border-border-main">
              <th className="py-3 px-3 text-[11px] font-bold uppercase text-text-muted w-10 text-center">
                CMP
              </th>
              <SortHeader colKey="rank" label="Rank" />
              <SortHeader colKey="number" label="Team #" />
              <th className="py-3 px-3 text-[11px] font-bold uppercase text-text-muted">
                Team Name & Drivetrain
              </th>
              <SortHeader colKey="score" label="Score" tooltip="Pre-PR Overall Scout Score" />
              <SortHeader colKey="epa_total" label="EPA Total" tooltip="Statbotics Expected Points Added" />
              <SortHeader colKey="epa_auto" label="Auto EPA" />
              <SortHeader colKey="epa_teleop" label="Teleop EPA" />
              <SortHeader colKey="opr" label="OPR" tooltip="Offensive Power Rating" />
              <SortHeader colKey="dpr" label="DPR" tooltip="Defensive Power Rating (Lower is better)" />
              <SortHeader colKey="winRate" label="Win %" tooltip="Verified Match Win Rate" />
              <SortHeader colKey="cycles" label="Cycles" tooltip="Average Teleop Game Piece Cycles" />
              <th className="py-3 px-3 text-[11px] font-bold uppercase text-text-muted text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50 text-xs font-mono">
            {sortedTeams.map(({ team, stats }, idx) => {
              const isSelected = selectedCompareTeams.some((t) => t.number === team.number);

              return (
                <tr
                  key={team.number}
                  onClick={() => onSelectTeam(team)}
                  className={`hover:bg-surface-hover/80 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-integra-yellow/5' : idx % 2 === 0 ? 'bg-transparent' : 'bg-bg-dark/30'
                  }`}
                >
                  {/* Compare Checkbox */}
                  <td
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare(team);
                    }}
                  >
                    <button
                      type="button"
                      className={`p-1 rounded transition-colors ${
                        isSelected
                          ? 'text-integra-yellow'
                          : 'text-text-muted hover:text-text-main opacity-60 hover:opacity-100'
                      }`}
                      title={isSelected ? 'Remove from compare' : 'Select for compare'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-integra-yellow" />
                      ) : (
                        <Scale className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Rank */}
                  <td className="py-2.5 px-3 font-bold text-text-muted">
                    #{team.rank}
                  </td>

                  {/* Team Number */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-black font-montserrat text-sm px-1.5 py-0.5 rounded ${
                        team.number === 3646
                          ? 'bg-integra-yellow text-[#111111]'
                          : 'text-text-main group-hover:text-integra-yellow transition-colors'
                      }`}
                    >
                      #{team.number}
                    </span>
                  </td>

                  {/* Name & Drivetrain */}
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-main group-hover:text-integra-yellow transition-colors">
                          {team.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-bg-dark border border-border-main text-integra-yellow font-mono uppercase">
                          {team.tier}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono truncate max-w-[240px]">
                        {stats.specs.drivetrain} • {stats.specs.driveMotors}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-2.5 px-3">
                    <span className="font-black text-integra-yellow text-sm">
                      {team.score}
                    </span>
                  </td>

                  {/* Total EPA */}
                  <td className="py-2.5 px-3 font-bold text-integra-yellow">
                    {stats.epa.total}
                  </td>

                  {/* Auto EPA */}
                  <td className="py-2.5 px-3 text-zinc-100 font-medium">
                    {stats.epa.auto}
                  </td>

                  {/* Teleop EPA */}
                  <td className="py-2.5 px-3 text-zinc-300 font-medium">
                    {stats.epa.teleop}
                  </td>

                  {/* OPR */}
                  <td className="py-2.5 px-3 font-semibold text-zinc-100">
                    {stats.opr}
                  </td>

                  {/* DPR */}
                  <td className="py-2.5 px-3 text-zinc-400">
                    {stats.dpr}
                  </td>

                  {/* Win Rate */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-integra-yellow">{stats.record.winRate}%</span>
                      <span className="text-[9px] text-text-muted">
                        {stats.record.wins}W-{stats.record.losses}L
                      </span>
                    </div>
                  </td>

                  {/* Cycles */}
                  <td className="py-2.5 px-3 text-zinc-300">
                    <span>{stats.cycles.avgTeleopCycles}</span>
                    <span className="text-[9px] text-text-muted ml-1">({stats.cycles.avgCycleTimeSec}s)</span>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-2.5 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5 font-sans">
                      <button
                        type="button"
                        onClick={() => onSelectTeam(team)}
                        className="p-1.5 rounded bg-bg-dark hover:bg-surface-hover text-text-muted hover:text-text-main border border-border-main transition-colors"
                        title="View Full Scouting Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSimulator(team)}
                        className="px-2 py-1 rounded bg-bg-dark hover:bg-surface-hover text-integra-yellow border border-integra-yellow/40 hover:border-integra-yellow transition-colors text-[10px] font-bold uppercase flex items-center gap-1"
                        title="Simulate Match in Arena"
                      >
                        <Swords className="w-3 h-3" />
                        <span>Sim</span>
                      </button>
                    </div>
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
