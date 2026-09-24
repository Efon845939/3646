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
} from 'lucide-react';
import { Team, mockTeams, getStatFullName, getEnhancedTeamStats } from '../data';
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
}

export function TeamModal({
  team,
  onClose,
  isSelectedForCompare = false,
  onToggleCompare,
  onOpenSimulator,
}: TeamModalProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'specs' | 'tactics'>('analytics');
  const [notes, setNotes] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`scout_notes_${team.number}`) || '';
    }
    return '';
  });
  const [savedStatus, setSavedStatus] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const frcStats = team.frcStats || getEnhancedTeamStats(team);

  useEffect(() => {
    const storedNotes = localStorage.getItem(`scout_notes_${team.number}`) || '';
    setNotes(storedNotes);
    setSavedStatus(false);
  }, [team.number]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setNotes(nextVal);
    localStorage.setItem(`scout_notes_${team.number}`, nextVal);
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
    localStorage.removeItem(`scout_notes_${team.number}`);
    setSavedStatus(false);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const [chartViewMode, setChartViewMode] = useState<'trend' | 'deviation'>('trend');

  const {
    trendData,
    avgScore,
    latestTrendDelta,
    maxDeviation,
    minDeviation,
    volatility,
    projectedScore,
  } = useMemo(() => {
    const base = team.score;
    const seed = team.number;
    const rawOffsets = [
      ((seed * 7 + 13) % 9) - 4,
      ((seed * 11 + 5) % 9) - 3,
      ((seed * 13 + 17) % 11) - 5,
      ((seed * 17 + 23) % 9) - 3,
      ((seed * 19 + 3) % 11) - 4,
      ((seed * 23 + 7) % 7) - 2,
      Math.round(((team.stats.tec - 50) * 0.08) + 1),
      Math.round(((team.stats.tec - 50) * 0.12) + 2),
    ];

    const matchLabels = ['QM1', 'QM3', 'QM5', 'QM8', 'QM10', 'QM12', 'SF1*', 'F1*'];
    const matchFullLabels = [
      'Qual Match 1',
      'Qual Match 3',
      'Qual Match 5',
      'Qual Match 8',
      'Qual Match 10',
      'Qual Match 12',
      'Playoff Semifinal 1 (Projected)',
      'Playoff Final 1 (Projected)',
    ];

    const points = rawOffsets.map((offset, idx) => {
      const isProjected = idx >= 6;
      const finalScore = Math.min(100, Math.max(20, base + offset));
      const deviation = Math.round((finalScore - base) * 10) / 10;

      return {
        match: matchLabels[idx],
        fullMatch: matchFullLabels[idx],
        score: finalScore,
        avg: base,
        deviation: deviation,
        isProjected,
      };
    });

    const actualPoints = points.filter((p) => !p.isProjected);
    const avgScore = base;
    const latestActual = actualPoints[actualPoints.length - 1];
    const firstActual = actualPoints[0];
    const latestTrendDelta = Math.round((latestActual.score - firstActual.score) * 10) / 10;
    const deviations = actualPoints.map((p) => p.deviation);
    const maxDeviation = Math.max(...deviations);
    const minDeviation = Math.min(...deviations);
    const variance = actualPoints.reduce((acc, p) => acc + Math.pow(p.score - base, 2), 0) / actualPoints.length;
    const volatility = Math.round(Math.sqrt(variance) * 10) / 10;
    const projectedScore = points[points.length - 1].score;

    return {
      trendData: points,
      avgScore,
      latestTrendDelta,
      maxDeviation,
      minDeviation,
      volatility,
      projectedScore,
    };
  }, [team.number, team.score, team.stats.tec]);

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

  const radarData = useMemo(() => {
    const categories: Array<{
      key: keyof Team['stats'];
      subject: string;
      fullName: string;
      desc: string;
    }> = [
      { key: 'out', subject: 'OUT', fullName: 'Outreach & Impact', desc: 'Community STEM and mentoring reach' },
      { key: 'sus', subject: 'SUS', fullName: 'Sustainability', desc: 'Financial stability & sponsor retention' },
      { key: 'tec', subject: 'TEC', fullName: 'Technical Floor', desc: 'Drivetrain, swerve, intake & shooter' },
      { key: 'pip', subject: 'PIP', fullName: 'Talent Pipeline', desc: 'Subteam training & student handover' },
      { key: 'med', subject: 'MED', fullName: 'Media & Branding', desc: 'Identity, pit presentation & social reach' },
      { key: 'dat', subject: 'DAT', fullName: 'Data & Analytics', desc: 'Match strategy, scouting app & telemetry' },
    ];

    return categories.map((cat) => {
      const primaryVal = team.stats[cat.key];
      const secondaryVal = overlayTeam ? overlayTeam.stats[cat.key] : 0;
      const delta = primaryVal - secondaryVal;

      return {
        subject: cat.subject,
        fullName: cat.fullName,
        desc: cat.desc,
        key: cat.key,
        A: primaryVal,
        B: secondaryVal,
        delta,
        fullMark: 100,
      };
    });
  }, [team.stats, overlayTeam]);

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
                <span className="text-xs px-2 py-0.5 rounded-full bg-integra-yellow/20 text-integra-yellow font-bold uppercase tracking-wider border border-integra-yellow/30 font-mono">
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
                    className="hover:text-integra-yellow flex items-center gap-1 transition-colors"
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
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => {
                  onOpenSimulator(team);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-integra-yellow/50 text-integra-yellow text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
              >
                <Swords className="w-4 h-4 text-integra-yellow" />
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
        <div className="flex items-center gap-2 px-5 py-2.5 bg-bg-dark border-b border-border-main text-xs font-bold uppercase tracking-wider">
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
            <span>FRC Performance & Statbotics</span>
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
              {/* Statbotics & TBA Key Metrics Overview Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-integra-yellow" />
                  <span>Statbotics EPA & Power Rating Telemetry</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">Total EPA</span>
                    <div className="text-xl font-mono font-black text-integra-yellow mt-1">
                      {frcStats.epa.total}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      Top {100 - frcStats.epa.percentile}% (Rank #{frcStats.seasonRank.worldRank})
                    </span>
                  </div>

                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">Auto EPA</span>
                    <div className="text-xl font-mono font-bold text-zinc-100 mt-1">
                      {frcStats.epa.auto}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">Autonomous phase</span>
                  </div>

                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">Teleop EPA</span>
                    <div className="text-xl font-mono font-bold text-zinc-200 mt-1">
                      {frcStats.epa.teleop}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">Driver control cycles</span>
                  </div>

                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">Endgame EPA</span>
                    <div className="text-xl font-mono font-bold text-zinc-300 mt-1">
                      {frcStats.epa.endgame}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">Stage & climb points</span>
                  </div>

                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">OPR / DPR</span>
                    <div className="text-xl font-mono font-bold text-zinc-100 mt-1">
                      {frcStats.opr} <span className="text-xs text-text-muted">/ {frcStats.dpr}</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">CCWM: {frcStats.ccwm}</span>
                  </div>

                  <div className="p-3 bg-bg-dark rounded-xl border border-border-main">
                    <span className="text-[9px] uppercase font-bold text-text-muted">Match Record</span>
                    <div className="text-xl font-mono font-bold text-integra-yellow mt-1">
                      {frcStats.record.winRate}%
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      {frcStats.record.wins}W - {frcStats.record.losses}L {frcStats.record.ties > 0 ? `(${frcStats.record.ties}T)` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Radar Chart & Score Trajectory Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-bg-dark rounded-xl border border-border-main p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Attribute Profile Radar
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
                      className={`text-[10px] px-2 py-1 rounded font-bold uppercase border transition-colors flex items-center gap-1.5 ${
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
                      <span className="text-sky-400 font-bold uppercase text-[10px]">Benchmark vs:</span>
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
                          tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}
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

                {/* Score Trend & Deviation Chart */}
                <div className="bg-bg-dark rounded-xl border border-border-main p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Match Performance Trajectory
                    </span>
                    <div className="inline-flex rounded-md bg-surface p-0.5 border border-border-main text-[10px]">
                      <button
                        type="button"
                        onClick={() => setChartViewMode('trend')}
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          chartViewMode === 'trend' ? 'bg-integra-yellow text-[#111111]' : 'text-text-muted'
                        }`}
                      >
                        Score Trend
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartViewMode('deviation')}
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          chartViewMode === 'deviation' ? 'bg-integra-yellow text-[#111111]' : 'text-text-muted'
                        }`}
                      >
                        Deviation (Δ)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2 text-center text-xs">
                    <div className="p-1.5 bg-surface rounded border border-border-main/50">
                      <span className="text-[9px] text-text-muted block">Avg Score</span>
                      <span className="font-mono font-bold text-text-main">{avgScore} pts</span>
                    </div>
                    <div className="p-1.5 bg-surface rounded border border-border-main/50">
                      <span className="text-[9px] text-text-muted block">Trajectory</span>
                      <span
                        className={`font-mono font-bold ${
                          latestTrendDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {latestTrendDelta >= 0 ? `+${latestTrendDelta}` : latestTrendDelta} pts
                      </span>
                    </div>
                    <div className="p-1.5 bg-surface rounded border border-border-main/50">
                      <span className="text-[9px] text-text-muted block">Playoff Proj</span>
                      <span className="font-mono font-bold text-amber-300">~{projectedScore} pts</span>
                    </div>
                  </div>

                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="match"
                          tick={{ fill: '#A1A1AA', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis tick={{ fill: '#A1A1AA', fontSize: 9, fontFamily: 'monospace' }} />
                        <ReferenceLine
                          y={chartViewMode === 'trend' ? avgScore : 0}
                          stroke="#71717A"
                          strokeDasharray="4 4"
                        />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey={chartViewMode === 'trend' ? 'score' : 'deviation'}
                          stroke="#FEDE00"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#FEDE00' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Hardware & Mechanical Specifications */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-integra-yellow" />
                  <span>Drivetrain, Vision & Hardware Pit Data</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Drivetrain</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.drivetrain}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Drive Motors</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.driveMotors}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Dimensions & Weight</span>
                    <p className="font-bold font-mono text-text-main mt-1">
                      {frcStats.specs.dimensions} • {frcStats.specs.weightLbs} lbs
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Vision Tracking</span>
                    <p className="font-bold font-mono text-text-main mt-1">{frcStats.specs.visionSystem}</p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Endgame Mechanism</span>
                    <p className="font-bold font-mono text-emerald-400 mt-1">
                      {frcStats.cycles.climbType} ({frcStats.cycles.climbSuccessPct}% success, {frcStats.cycles.avgClimbSec}s)
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-border-main">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Teleop Cycling Metric</span>
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
                  <span>Documented Autonomous Routines</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {frcStats.specs.autoRoutines.map((routine, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface border border-border-main flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-integra-yellow/20 text-integra-yellow text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-text-main text-xs">{routine}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Awards & History */}
              {team.awards && team.awards.length > 0 && (
                <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                  <div className="flex items-center justify-between border-b border-border-main pb-2 mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-main flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-integra-yellow" />
                      <span>Resmi FIRST & The Blue Alliance Ödül Geçmişi</span>
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-integra-yellow/20 text-integra-yellow font-bold font-mono">
                      {team.awards.length} Ödül
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {team.awards.map((award, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-surface border border-border-main text-xs flex items-start gap-2"
                      >
                        <Trophy className="w-3.5 h-3.5 text-integra-yellow shrink-0 mt-0.5" />
                        <span className="text-zinc-300 font-medium leading-snug">{award}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="space-y-6">
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
                    <span className="px-2.5 py-1 rounded bg-zinc-700/30 text-zinc-300 border border-zinc-700 text-xs font-bold uppercase">
                      Secondary Pick Option
                    </span>
                  )}
                </div>

                <div className="p-3 bg-surface rounded-lg border border-border-main">
                  <span className="text-[10px] uppercase font-bold text-integra-yellow block mb-1">
                    Tactical Counter-Play & Recommendation
                  </span>
                  <p className="text-xs text-text-main leading-relaxed">{team.counterPlay}</p>
                </div>

                <div className="p-3 bg-surface rounded-lg border border-border-main">
                  <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">
                    Seasonal Performance Outlook
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">{team.prediction}</p>
                </div>
              </div>

              {/* Scout Notes */}
              <div className="bg-bg-dark rounded-xl border border-border-main p-5">
                <div className="flex items-center justify-between mb-3 border-b border-border-main pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <FileText className="w-4 h-4 text-integra-yellow" />
                    <span>Scout Notes & Pit Observations</span>
                  </h3>
                  {savedStatus && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
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
                <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted">
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
