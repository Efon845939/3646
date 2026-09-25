import React from 'react';
import { Scale, CheckSquare } from 'lucide-react';
import { Team, STAT_META } from '../data';
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

// The card identifies the team and shows one visual stat: the hexagon profile. Every number
// (record, OPR, events, awards) lives in the team modal, one click away.
export function TeamCard({
  team,
  isSelectedForCompare = false,
  onToggleCompare,
  compareIndex,
  picklistLane = null,
}: TeamCardProps) {
  const radarValues = RADAR_AXES.map((axis) => team.stats[axis.key as keyof Team['stats']]);
  const isHost = team.number === HOST_TEAM_NUMBER;

  return (
    <div
      className={`bg-surface rounded-2xl border p-6 h-full flex flex-col gap-4 transition-colors duration-200 ${
        isSelectedForCompare
          ? 'border-integra-yellow ring-1 ring-integra-yellow/70'
          : 'border-border-main hover:border-text-muted/40'
      } ${isHost ? 'border-l-4 border-l-integra-yellow' : ''}`}
    >
      {/* Rank, badges and compare toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-bold text-text-muted font-mono">RANK #{team.rank}</span>
          {isHost && (
            <span className="px-2 py-0.5 rounded-md bg-integra-yellow text-[#111111] text-sm font-black uppercase">
              Host
            </span>
          )}
          {picklistLane && (
            <span
              className={`px-2 py-0.5 rounded-md border text-sm font-black uppercase ${PICKLIST_LANE_META[picklistLane].badgeClass}`}
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
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-base font-bold transition-colors ${
            isSelectedForCompare
              ? 'bg-integra-yellow text-[#111111] border-integra-yellow'
              : 'border-border-main text-text-muted hover:text-text-main hover:bg-surface-hover'
          }`}
        >
          {isSelectedForCompare ? <CheckSquare className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
          {isSelectedForCompare && compareIndex !== undefined && compareIndex >= 0 && <span>{compareIndex + 1}</span>}
        </button>
      </div>

      {/* Identity on the left, the hexagon profile as the only stat on the right */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
        <div className="sm:w-[42%] min-w-0 space-y-2">
          <div className="text-5xl font-black font-montserrat tracking-tight text-text-main leading-none">
            #{team.number}
          </div>
          <div className="text-lg font-bold uppercase tracking-wide text-text-main leading-snug line-clamp-2">
            {team.name}
          </div>
          <div className="text-base text-text-muted truncate">{team.location || 'FRC Team'}</div>
          <span className="inline-block bg-integra-yellow text-[#111111] px-2.5 py-1 text-base font-montserrat font-black rounded-md">
            {team.score} PTS
          </span>
        </div>
        <div className="flex-1 min-w-0 aspect-[3/2]">
          <HexRadar
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
    </div>
  );
}
