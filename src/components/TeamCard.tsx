import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Team, STAT_META, getEnhancedTeamStats } from '../data';
import { PICKLIST_LANE_META, PicklistLane } from '../hooks/usePicklist';
import { ShieldAlert, Trophy, Palette, ChevronDown, ChevronUp, Scale, CheckSquare, Zap, Cpu, Award } from 'lucide-react';

interface TeamCardProps {
  topScore?: number;
  key?: React.Key;
  team: Team;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (team: Team) => void;
  compareIndex?: number;
  onOpenDetails?: (team: Team) => void;
  picklistLane?: PicklistLane | null;
}

export function TeamCard({
  team,
  topScore = 97,
  isSelectedForCompare = false,
  onToggleCompare,
  compareIndex,
  onOpenDetails,
  picklistLane = null,
}: TeamCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const frcStats = team.frcStats || getEnhancedTeamStats(team);

  const radarData = [
    { subject: 'OUT', fullName: STAT_META.out.fullName, A: team.stats.out, fullMark: 100 },
    { subject: 'SUS', fullName: STAT_META.sus.fullName, A: team.stats.sus, fullMark: 100 },
    { subject: 'TEC', fullName: STAT_META.tec.fullName, A: team.stats.tec, fullMark: 100 },
    { subject: 'PIP', fullName: STAT_META.pip.fullName, A: team.stats.pip, fullMark: 100 },
    { subject: 'MED', fullName: STAT_META.med.fullName, A: team.stats.med, fullMark: 100 },
    { subject: 'DAT', fullName: STAT_META.dat.fullName, A: team.stats.dat, fullMark: 100 },
  ];

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'High Threat':
        return <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" />;
      case 'Impact Winner':
        return <Trophy className="w-3 h-3 mr-1 text-accent" />;
      case 'Best Branding':
        return <Palette className="w-3 h-3 mr-1 text-sky-400" />;
      case 'Most Creative':
        return <Award className="w-3 h-3 mr-1 text-emerald-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-surface rounded-xl border p-4.5 flex flex-col space-y-3.5 transition-all duration-200 h-full relative group ${
        isSelectedForCompare
          ? 'border-integra-yellow ring-1 ring-integra-yellow/70 bg-surface/95'
          : 'border-border-main hover:border-zinc-500/60 hover:bg-surface-hover/50'
      }`}
    >
      {/* Top Header Bar: Compare Toggle & Rank */}
      <div className="flex justify-between items-center pb-2.5 border-b border-border-main/60">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare?.(team);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all duration-150 border ${
            isSelectedForCompare
              ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-black shadow-xs'
              : 'bg-bg-dark/80 hover:bg-surface-hover text-text-muted hover:text-text-main border-border-main'
          }`}
          title={isSelectedForCompare ? 'Remove from compare' : 'Select for quick compare'}
        >
          {isSelectedForCompare ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-[#111111]" />
              <span>Comparing {compareIndex !== undefined ? `(#${compareIndex + 1})` : ''}</span>
            </>
          ) : (
            <>
              <Scale className="w-3.5 h-3.5 opacity-70" />
              <span>+ Compare</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {picklistLane && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${PICKLIST_LANE_META[picklistLane].badgeClass}`}
              title="Position on the alliance picklist (P)"
            >
              {PICKLIST_LANE_META[picklistLane].short}
            </span>
          )}
          {team.number === 3646 && (
            <span className="px-1.5 py-0.5 rounded bg-integra-yellow/20 text-accent text-[9px] font-black uppercase tracking-wider border border-integra-yellow/30">
              Host / IntegrA
            </span>
          )}
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Rank #{team.rank}
          </span>
        </div>
      </div>

      {/* Team Identification */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-montserrat uppercase text-text-main tracking-tight">
              #{team.number}
            </span>
            <span className="text-[10px] text-text-muted font-mono truncate max-w-[150px]">
              {team.location || 'FRC Team'}
            </span>
          </div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide truncate">
            {team.name}
          </span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="bg-integra-yellow text-[#111111] border-2 border-[#111111] px-2 py-0.5 text-xs font-montserrat font-black uppercase rounded-xs">
            {team.score} PTS
          </div>
          <span className="text-[9px] text-accent mt-1 font-bold uppercase tracking-wider">
            {team.tier} TIER
          </span>
        </div>
      </div>

      {/* FRC Performance Telemetry Chips */}
      <div className="grid grid-cols-3 gap-1.5 py-1 px-2 bg-bg-dark/70 rounded-lg border border-border-main/70 text-center">
        <div className="flex flex-col py-1">
          <span className="text-[8px] font-bold uppercase text-text-muted tracking-wider">EPA Rating</span>
          <span className="text-xs font-mono font-bold text-accent">
            {frcStats.epa.total}
          </span>
          <span className="text-[8px] font-mono text-text-muted">
            A:{frcStats.epa.auto} T:{frcStats.epa.teleop}
          </span>
        </div>

        <div className="flex flex-col py-1 border-x border-border-main/50">
          <span className="text-[8px] font-bold uppercase text-text-muted tracking-wider">OPR / DPR</span>
          <span className="text-xs font-mono font-bold text-text-main">
            {frcStats.opr}
          </span>
          <span className="text-[8px] font-mono text-text-muted">
            DPR: {frcStats.dpr}
          </span>
        </div>

        <div className="flex flex-col py-1">
          <span className="text-[8px] font-bold uppercase text-text-muted tracking-wider">Record / WR</span>
          <span className="text-xs font-mono font-bold text-accent">
            {frcStats.record.winRate}%
          </span>
          <span className="text-[8px] font-mono text-text-muted">
            {frcStats.record.wins}W-{frcStats.record.losses}L
          </span>
        </div>
      </div>

      {/* Robot Specs Bar */}
      <div className="flex items-center justify-between text-[10px] text-text-muted bg-surface-hover/60 px-2.5 py-1 rounded-md border border-border-main/50">
        <span className="flex items-center gap-1 font-medium truncate max-w-[190px]" title={frcStats.specs.drivetrain}>
          <Cpu className="w-3 h-3 text-accent shrink-0" />
          <span className="truncate">{frcStats.specs.drivetrain}</span>
        </span>
        <span className="font-mono text-text-main/80 font-semibold shrink-0">
          {frcStats.cycles.avgTeleopCycles} cyc
        </span>
      </div>

      {/* Tags */}
      {team.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-bg-dark text-text-main/80 border border-border-main uppercase tracking-wider"
            >
              {getTagIcon(tag)}
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Radar Chart */}
      <div className="h-[185px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid stroke="#27272a" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="subject"
              tick={(props: any) => {
                const { payload, x, y, textAnchor } = props;
                const subjectVal = payload.value;
                const matched = radarData.find((d) => d.subject === subjectVal);
                const fullName = matched?.fullName || subjectVal;
                const isHovered = hoveredStat === subjectVal;

                return (
                  <g
                    className="cursor-pointer select-none"
                    onMouseEnter={() => setHoveredStat(subjectVal)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <title>{fullName}</title>
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      fill={isHovered ? '#FEDE00' : '#A1A1AA'}
                      fontSize={isHovered ? 10 : 9}
                      fontFamily="Montserrat"
                      fontWeight={isHovered ? 800 : 700}
                      className="transition-colors duration-150"
                    >
                      {isHovered ? fullName : subjectVal}
                    </text>
                  </g>
                );
              }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Stats"
              dataKey="A"
              stroke="#FEDE00"
              strokeWidth={1.75}
              fill="#FEDE00"
              fillOpacity={0.25}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-surface border border-border-main rounded-lg px-2.5 py-1.5 shadow-xl text-xs z-50">
                      <div className="font-montserrat font-bold text-text-main text-[11px] mb-1 pb-1 border-b border-border-main">
                        {data.fullName}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-text-muted font-medium">Scout Rating:</span>
                        <span className="font-mono font-bold text-accent">{data.A} / 100</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Scout Summary & Expandable Pros/Cons */}
      <div className="flex-grow flex flex-col justify-end space-y-2.5 pt-1">
        <div className="p-2.5 bg-bg-dark/80 rounded-lg border-l-2 border-l-integra-yellow border-border-main border">
          <p className="text-[10px] text-text-main/80 italic leading-snug line-clamp-2">
            "{team.critique}"
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center justify-between w-full py-1 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
          >
            <span>Strengths & Risks</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2.5 font-inter text-xs border-t border-border-main/50 pt-2">
              <div>
                <div className="text-[11px] flex items-center text-emerald-400 font-bold uppercase mb-1">
                  Pros (Avantajlar)
                </div>
                <ul className="space-y-1">
                  {team.pros.map((pro, i) => (
                    <li
                      key={i}
                      className="text-text-muted text-[10px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-emerald-500/60 before:rounded-full"
                    >
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[11px] flex items-center text-rose-400 font-bold uppercase mb-1">
                  Cons (Zayıflıklar)
                </div>
                <ul className="space-y-1">
                  {team.cons.map((con, i) => (
                    <li
                      key={i}
                      className="text-text-muted text-[10px] pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-rose-500/60 before:rounded-full"
                    >
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
