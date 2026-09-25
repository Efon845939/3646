import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  X,
  Trophy,
  ShieldAlert,
  Palette,
  TrendingUp,
  FileText,
  Check,
  Scale,
  CheckSquare,
  Swords,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  ChevronDown,
  Globe,
  ExternalLink,
  Cpu,
  Target,
  Clock,
  Compass,
  Zap,
  Gauge,
  Percent,
  Award,
  ListOrdered,
} from 'lucide-react';
import { Team, mockTeams, STAT_META, getEnhancedTeamStats } from '../data';
import { formatRecord, getRealMetrics, REAL_DATA_YEAR, winRateOf } from '../utils/realMetrics';
import { MatchupIntelPanel } from './MatchupIntelPanel';
import { PICKLIST_LANES, PICKLIST_LANE_META, PicklistLane } from '../hooks/usePicklist';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';
import { readScoutNotes, removeStorage, scoutNotesKey, writeStorage } from '../utils/storage';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface TeamModalProps {
  team: Team;
  onClose: () => void;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (team: Team) => void;
  onOpenSimulator?: (team: Team) => void;
  picklistLane?: PicklistLane | null;
  onSetPicklistLane?: (team: Team, lane: PicklistLane | null) => void;
}

export function TeamModal({
  team,
  onClose,
  isSelectedForCompare = false,
  onToggleCompare,
  onOpenSimulator,
  picklistLane = null,
  onSetPicklistLane,
}: TeamModalProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'specs' | 'tactics'>('analytics');
  const [notes, setNotes] = useState<string>(() => readScoutNotes(team.number));
  const [savedStatus, setSavedStatus] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const frcStats = team.frcStats || getEnhancedTeamStats(team);

  useEffect(() => {
    setNotes(readScoutNotes(team.number));
    setSavedStatus(false);
  }, [team.number]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setNotes(nextVal);
    writeStorage(scoutNotesKey(team.number), nextVal);
    setSavedStatus(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSavedStatus(false);
    }, 2000);
  };

  const handleClearNotes = () => {
    setNotes('');
    removeStorage(scoutNotesKey(team.number));
    setSavedStatus(false);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Escape is handled by useGlobalShortcuts, which closes one layer at a time. A second
  // listener here used to close this modal too when Esc was meant for the shortcuts guide.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const real = getRealMetrics(team.number);

  // Radar Overlay Comparison state
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(false);
  const [hoveredRadarStat, setHoveredRadarStat] = useState<string | null>(null);
  const [overlayTeamNumber, setOverlayTeamNumber] = useState<number>(() => {
    if (team.number === 3646) {
      const topRival = mockTeams.find((t) => t.number === 1678);
      return topRival ? topRival.number : mockTeams.find((t) => t.number !== team.number)?.number || 0;
    }
    const integra = mockTeams.find((t) => t.number === 3646);
    if (integra) return integra.number;
    return mockTeams.find((t) => t.number !== team.number)?.number || 0;
  });

  const overlayTeam = useMemo(() => {
    return mockTeams.find((t) => t.number === overlayTeamNumber) || null;
  }, [overlayTeamNumber]);

  const availableOverlayTeams = useMemo(() => {
    return mockTeams
      .filter((t) => t.number !== team.number)
      .sort((a, b) => b.score - a.score);
  }, [team.number]);

  const radarData = useMemo(
    () =>
      (Object.keys(STAT_META) as Array<keyof typeof STAT_META>).map((key) => ({
        subject: STAT_META[key].label,
        fullName: STAT_META[key].fullName,
        desc: STAT_META[key].desc,
        key,
        A: team.stats[key],
        B: overlayTeam ? overlayTeam.stats[key] : 0,
        fullMark: 100,
      })),
    [team.stats, overlayTeam]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface border border-border-main rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-border-main bg-bg-dark/95 gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-integra-yellow text-[#111111] border-2 border-[#111111] px-3 py-1 text-2xl font-montserrat font-black uppercase rounded-sm">
              #{team.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-montserrat uppercase text-text-main">
                  {team.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-integra-yellow/20 text-accent font-bold uppercase tracking-wider border border-integra-yellow/30 font-mono">
                  {team.tier} Tier
                </span>
                <span className="text-xs text-text-muted font-mono font-semibold">
                  Rank #{team.rank}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                <span>{team.location || 'FRC Competition'}</span>
                {team.website && (
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {team.tbaUrl && (
                  <a
                    href={team.tbaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sky-400 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>The Blue Alliance</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {onSetPicklistLane && team.number !== HOST_TEAM_NUMBER && (
              <div
                className="inline-flex items-center rounded-lg border border-border-main bg-surface p-0.5 text-xs font-bold uppercase"
                role="group"
                aria-label="Picklist lane"
              >
                <ListOrdered className="w-3.5 h-3.5 text-accent mx-1.5" aria-hidden="true" />
                {PICKLIST_LANES.map((lane) => {
                  const isActive = picklistLane === lane;
                  return (
                    <button
                      key={lane}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onSetPicklistLane(team, isActive ? null : lane)}
                      className={`px-2 py-1 rounded-md border transition-colors ${
                        isActive
                          ? PICKLIST_LANE_META[lane].badgeClass
                          : 'border-transparent text-text-muted hover:text-text-main'
                      }`}
                      title={isActive ? 'Remove from picklist' : `Add to ${PICKLIST_LANE_META[lane].label}`}
                    >
                      {PICKLIST_LANE_META[lane].short}
                    </button>
                  );
                })}
              </div>
            )}

            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => {
                  onOpenSimulator(team);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-integra-yellow/50 text-accent text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Swords className="w-4 h-4 text-accent" />
                <span>Simulate</span>
              </button>
            )}

            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(team)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase flex items-center gap-1.5 transition-colors ${
                  isSelectedForCompare
                    ? 'bg-integra-yellow text-[#111111] border-integra-yellow'
                    : 'bg-surface hover:bg-surface-hover border-border-main text-text-muted hover:text-text-main'
                }`}
              >
                {isSelectedForCompare ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Comparing</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-3.5 h-3.5" />
                    <span>+ Compare</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border border-border-main transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark border-b border-border-main text-xs font-bold uppercase tracking-wider overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'analytics'
                ? 'bg-integra-yellow text-[#111111] font-black'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Season Performance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'specs'
                ? 'bg-integra-yellow text-[#111111] font-black'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Pit Scouting & Mechanism Specs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tactics')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'tactics'
                ? 'bg-integra-yellow text-[#111111] font-black'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Tactical Strategy & Matchup</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 font-inter">
          {activeTab === 'analytics' && (
            <>
              {/* Real season summary from The Blue Alliance */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-accent" />
                  <span>{REAL_DATA_YEAR} Season · The Blue Alliance</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <SeasonStat label="Record" value={formatRecord(real?.record ?? null)} />
                  <SeasonStat label="Win Rate" value={`${winRateOf(real?.record ?? null) ?? '—'}%`} accent />
                  <SeasonStat label="Best OPR" value={real?.bestOpr ?? '—'} accent />
                  <SeasonStat label="Best Event Rank" value={real?.bestEventRank ? `#${real.bestEventRank}` : '—'} />
                  <SeasonStat label={`${REAL_DATA_YEAR} Awards`} value={real?.awards2026 ?? 0} />
                  <SeasonStat label="Impact Wins" value={real?.impactWins ?? 0} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-bg-dark rounded-xl border border-border-main p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-text-muted">
                      Profile Radar (percentiles)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
                      className={`text-xs px-2 py-1 rounded font-bold uppercase border transition-colors flex items-center gap-1.5 ${
                        isOverlayEnabled
                          ? 'bg-sky-400 text-[#111111] border-sky-400'
                          : 'bg-surface hover:bg-surface-hover text-text-muted border-border-main'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Compare Overlay: {isOverlayEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {isOverlayEnabled && (
                    <div className="mb-3 p-2 bg-surface rounded-lg border border-sky-500/30 flex items-center justify-between text-xs">
                      <span className="text-sky-400 font-bold uppercase text-xs">Benchmark vs:</span>
                      <select
                        value={overlayTeamNumber}
                        onChange={(e) => setOverlayTeamNumber(Number(e.target.value))}
                        className="bg-bg-dark border border-sky-500/40 rounded px-2 py-0.5 text-xs text-text-main outline-none"
                      >
                        {availableOverlayTeams.map((t) => (
                          <option key={t.number} value={t.number}>
                            #{t.number} {t.name} (Score: {t.score})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#27272a" strokeWidth={1} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#A1A1AA', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name={`#${team.number}`}
                          dataKey="A"
                          stroke="#FEDE00"
                          strokeWidth={2}
                          fill="#FEDE00"
                          fillOpacity={isOverlayEnabled ? 0.2 : 0.35}
                        />
                        {isOverlayEnabled && overlayTeam && (
                          <Radar
                            name={`#${overlayTeam.number}`}
                            dataKey="B"
                            stroke="#38BDF8"
                            strokeWidth={2}
                            fill="#38BDF8"
                            fillOpacity={0.2}
                          />
                        )}
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Every 2026 event with its real result */}
                <div className="bg-bg-dark rounded-xl border border-border-main p-4 flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3">
                    {REAL_DATA_YEAR} Events
                  </span>
                  {real && real.events.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border-main">
                          <th className="text-left font-bold pb-2">Event</th>
                          <th className="text-right font-bold pb-2 pl-3 whitespace-nowrap">Rank</th>
                          <th className="text-right font-bold pb-2 pl-3 whitespace-nowrap">W-L-T</th>
                          <th className="text-right font-bold pb-2 pl-3 whitespace-nowrap">OPR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/60">
                        {real.events.map((event) => (
                          <tr key={event.key} className="align-top">
                            <td className="py-2 pr-2">
                              <span className="font-semibold text-text-main">{event.name}</span>
                              {event.awards.length > 0 && (
                                <span className="block text-xs text-accent mt-0.5">🏆 {event.awards.join(', ')}</span>
                              )}
                              {event.playoff && (
                                <span className="block text-xs text-text-muted mt-0.5">Playoffs: {event.playoff}</span>
                              )}
                            </td>
                            <td className="py-2 pl-3 text-right font-mono whitespace-nowrap">{event.rank ? `#${event.rank}` : '—'}</td>
                            <td className="py-2 pl-3 text-right font-mono whitespace-nowrap">{event.record.join('-')}</td>
                            <td className="py-2 pl-3 text-right font-mono font-bold whitespace-nowrap">{event.opr ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-text-muted">No {REAL_DATA_YEAR} events on record.</p>
                  )}
                  {real?.pool && (
                    <p className="text-sm text-text-muted mt-3">
                      {real.pool.name}: <span className="font-bold text-text-main">#{real.pool.rank}</span> ({real.pool.points} pts)
                    </p>
                  )}
                </div>
              </div>

              {/* Impact award record, all seasons */}
              {real && real.impactHistory.length > 0 && (
                <div className="bg-bg-dark rounded-xl border border-border-main p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    <span>Impact / Chairman's Award History</span>
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {real.impactHistory.map((award, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-surface border border-border-main text-sm">
                        <span className="font-mono font-bold text-text-main">{award.year}</span>{' '}
                        <span className={/Finalist/.test(award.name) ? 'text-text-muted' : 'text-accent font-semibold'}>
                          {award.name}
                        </span>
                        <span className="block text-xs text-text-muted">{award.event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              <p className="text-sm p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-text-main">
                These pit specs are placeholders, not verified data. No public source lists drivetrains,
                motors or auto routines, so replace them with what your scouts see in the pits.
              </p>
              {/* Hardware & Mechanical Specifications */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent" />
                  <span>Drivetrain, Vision & Hardware Pit Data</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Drivetrain</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.drivetrain}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Drive Motors</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.driveMotors}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Dimensions & Weight</span>
                    <p className="font-bold font-mono text-text-main mt-1">
                      {frcStats.specs.dimensions} • {frcStats.specs.weightLbs} lbs
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Vision Tracking</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.visionSystem}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Endgame Mechanism</span>
                    <p className="font-bold font-mono text-emerald-400 mt-1">
                      {frcStats.cycles.climbType} ({frcStats.cycles.climbSuccessPct}% success, {frcStats.cycles.avgClimbSec}s)
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-xs uppercase font-bold text-text-muted">Teleop Cycling Metric</span>
                    <p className="font-bold font-mono text-amber-400 mt-1">
                      {frcStats.cycles.avgTeleopCycles} pieces/match • {frcStats.cycles.avgCycleTimeSec}s cycle time
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Autonomous Routines */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Autonomous Routines (unverified)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {frcStats.specs.autoRoutines.map((routine, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface border border-border-main flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-integra-yellow/20 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-text-main text-xs">{routine}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="space-y-6">
              <MatchupIntelPanel team={team} />

              {/* Tactical Strengths & Counter-Play */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Core Strengths & Advantages</span>
                  </h3>
                  <ul className="space-y-2">
                    {team.pros.map((pro, i) => (
                      <li
                        key={i}
                        className="text-text-muted text-xs pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-emerald-500 before:rounded-full"
                      >
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Vulnerabilities & Exploit Targets</span>
                  </h3>
                  <ul className="space-y-2">
                    {team.cons.map((con, i) => (
                      <li
                        key={i}
                        className="text-text-muted text-xs pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-rose-500 before:rounded-full"
                      >
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Relationship Status & Counter Play Recommendation */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Alliance Strategic Relationship
                  </span>
                  {team.number === 3646 ? (
                    <span className="px-2.5 py-1 rounded bg-integra-yellow text-[#111111] text-xs font-black uppercase">
                      IntegrA (Host / Our Team)
                    </span>
                  ) : team.score >= 95 ? (
                    <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase">
                      Prime Playoff Rival
                    </span>
                  ) : team.score >= 85 ? (
                    <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase">
                      High-Priority Alliance Candidate
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-zinc-700/30 text-text-main/80 border border-zinc-700 text-xs font-bold uppercase">
                      Secondary Pick Option
                    </span>
                  )}
                </div>

                <div className="p-3 bg-surface rounded-lg border border-border-main">
                  <span className="text-xs uppercase font-bold text-accent block mb-1">
                    Tactical Counter-Play & Recommendation
                  </span>
                  <p className="text-xs text-text-main leading-relaxed">{team.counterPlay}</p>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-border-main">
                  <span className="text-xs uppercase font-bold text-text-muted block mb-1">
                    Seasonal Performance Outlook
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">{team.prediction}</p>
                </div>
              </div>

              {/* Scout Notes */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span>Scout Notes & Pit Observations</span>
                  </h3>
                  {savedStatus && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved locally
                    </span>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder={`Write driver habits, mechanism reliability, or alliance synergy notes for #${team.number}...`}
                  rows={3}
                  className="w-full bg-surface border border-border-main rounded-lg p-3 text-xs text-text-main placeholder-text-muted outline-none focus:border-integra-yellow transition-colors resize-none leading-relaxed"
                />
                <div className="flex justify-between items-center mt-2 text-xs text-text-muted">
                  <span>Persisted in browser localStorage for this team</span>
                  {notes && (
                    <button
                      type="button"
                      onClick={handleClearNotes}
                      className="text-text-muted hover:text-rose-400 transition-colors underline"
                    >
                      Clear notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeasonStat({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
      <span className="text-xs uppercase font-bold text-text-muted">{label}</span>
      <div className={`text-2xl font-mono font-black mt-1 ${accent ? 'text-accent' : 'text-text-main'}`}>{value}</div>
    </div>
  );
}
