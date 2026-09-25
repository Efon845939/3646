import React from 'react';
import { Scale, CheckSquare } from 'lucide-react';
import { Team, STAT_META } from '../data';
import { formatRecord, getRealMetrics, winRateOf } from '../utils/realMetrics';
import { HexRadar, HexRadarAxis } from './HexRadar';
import { PICKLIST_LANE_META, PicklistLane } from '../hooks/usePicklist';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';

const RADAR_AXES: HexRadarAxis[] = (Object.keys(STAT_META) as Array<keyof typeof STAT_META>).map((key) => ({
  key,
  label: STAT_META[key].label,
  fullName: STAT_META[key].fullName,
}));

interface TeamCardProps {
  team: Team;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (team: Team) => void;
  compareIndex?: number;
  picklistLane?: PicklistLane | null;
}

// The card is a summary: identity plus the three numbers used to rank teams at a glance.
// Everything else (specs, tags, critique, pros/cons) lives in the team modal.
export function TeamCard({
  team,
  isSelectedForCompare = false,
  onToggleCompare,
  compareIndex,
  picklistLane = null,
}: TeamCardProps) {
  const real = getRealMetrics(team.number);
  const radarValues = RADAR_AXES.map((axis) => team.stats[axis.key as keyof Team['stats']]);
  const isHost = team.number === HOST_TEAM_NUMBER;

  return (
    <div
      className={`bg-surface rounded-2xl border p-5 sm:p-6 h-full flex flex-col gap-5 transition-colors duration-200 ${
        isSelectedForCompare
          ? 'border-integra-yellow ring-1 ring-integra-yellow/70'
          : 'border-border-main hover:border-text-muted/40'
      } ${isHost ? 'border-l-4 border-l-integra-yellow' : ''}`}
    >
      {/* Rank, badges and compare toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-text-muted font-mono">RANK #{team.rank}</span>
          {isHost && (
            <span className="px-2 py-0.5 rounded-md bg-integra-yellow text-[#111111] text-xs font-black uppercase">
              Host
            </span>
          )}
          {picklistLane && (
            <span
              className={`px-2 py-0.5 rounded-md border text-xs font-black uppercase ${PICKLIST_LANE_META[picklistLane].badgeClass}`}
              title="Position on the alliance picklist (P)"
            >
              {PICKLIST_LANE_META[picklistLane].short}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare?.(team);
          }}
          aria-pressed={isSelectedForCompare}
          aria-label={isSelectedForCompare ? `Remove #${team.number} from compare` : `Add #${team.number} to compare`}
          title={isSelectedForCompare ? 'Remove from compare' : 'Add to compare'}
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-bold transition-colors ${
            isSelectedForCompare
              ? 'bg-integra-yellow text-[#111111] border-integra-yellow'
              : 'border-border-main text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          {isSelectedForCompare ? <CheckSquare className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          {isSelectedForCompare && compareIndex !== undefined && compareIndex >= 0 && <span>{compareIndex + 1}</span>}
        </button>
      </div>

      {/* Identity and profile shape */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-4xl font-black font-montserrat tracking-tight text-text-main">#{team.number}</span>
            <span className="bg-integra-yellow text-[#111111] px-2 py-0.5 text-sm font-montserrat font-black rounded-md">
              {team.score} PTS
            </span>
          </div>
          <div className="text-base font-bold uppercase tracking-wide text-text-main truncate">{team.name}</div>
          <div className="text-sm text-text-muted truncate">{team.location || 'FRC Team'}</div>
        </div>
        <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0">
          <HexRadar
            showLabels={false}
            axes={RADAR_AXES}
            series={[
              {
                name: `#${team.number}`,
                values: radarValues,
                polygonClass: 'fill-integra-yellow/25 stroke-accent',
                dotClass: 'fill-accent',
              },
            ]}
          />
        </div>
      </div>

      {/* The three numbers that matter most at a glance, all real 2026 results */}
      <div className="grid grid-cols-3 border-t border-border-main pt-4 mt-auto">
        <KeyStat label="Best OPR" value={real?.bestOpr ?? '—'} accent />
        <KeyStat label="Record" value={formatRecord(real?.record ?? null)} />
        <KeyStat label="Win Rate" value={`${winRateOf(real?.record ?? null) ?? '—'}%`} />
      </div>
    </div>
  );
}

function KeyStat({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-2xl font-mono font-bold ${accent ? 'text-accent' : 'text-text-main'}`}>{value}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  );
}
