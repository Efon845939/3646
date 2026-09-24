import React, { useState } from 'react';
import { X, Search, Swords, Scale, Cpu, Gauge, Trophy } from 'lucide-react';
import { Team, mockTeams, STAT_META, getEnhancedTeamStats } from '../data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TeamCompareProps {
  teams: Team[];
  onRemoveTeam: (team: Team) => void;
  onAddTeam: (team: Team) => void;
  onClose: () => void;
  onOpenSimulator?: (teamA: Team, teamB: Team) => void;
}

export function TeamCompare({
  teams,
  onRemoveTeam,
  onAddTeam,
  onClose,
  onOpenSimulator,
}: TeamCompareProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return mockTeams
      .filter(
        (t) =>
          !teams.find((ct) => ct.number === t.number) &&
          (t.name.toLowerCase().includes(q) || t.number.toString().includes(q))
      )
      .slice(0, 5);
  }, [searchQuery, teams]);

  const chartData: Array<{ subject: string; fullName: string; [key: string]: any }> = [
    { subject: 'OUT', fullName: STAT_META.out.fullName },
    { subject: 'SUS', fullName: STAT_META.sus.fullName },
    { subject: 'TEC', fullName: STAT_META.tec.fullName },
    { subject: 'PIP', fullName: STAT_META.pip.fullName },
    { subject: 'MED', fullName: STAT_META.med.fullName },
    { subject: 'DAT', fullName: STAT_META.dat.fullName },
  ];

  chartData.forEach((cd) => {
    teams.forEach((t, index) => {
      cd[`Team${index}`] = t.stats[cd.subject.toLowerCase() as keyof typeof t.stats];
    });
  });

  const colors = ['#FEDE00', '#38BDF8', '#F43F5E', '#10B981'];

  const teamsWithStats = teams.map((team) => ({
    team,
    stats: team.frcStats || getEnhancedTeamStats(team),
  }));

  return (
    <div className="flex flex-col h-full bg-surface border border-border-main rounded-xl p-5 sm:p-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-border-main gap-3">
        <div>
          <h2 className="text-2xl font-black font-montserrat uppercase text-text-main">
            Head-to-Head Team Comparison
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Compare up to 4 teams across Statbotics EPA, TBA power ratings, and pit scouting specifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {teams.length >= 2 && onOpenSimulator && (
            <button
              type="button"
              onClick={() => onOpenSimulator(teams[0], teams[1])}
              className="px-3.5 py-2 bg-integra-yellow text-[#111111] hover:bg-amber-400 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Swords className="w-4 h-4 text-[#111111]" />
              <span>Simulate #{teams[0].number} vs #{teams[1].number}</span>
            </button>
          )}

          <button
            id="btn-compare-back"
            onClick={onClose}
            aria-keyshortcuts="Escape"
            title="Back to Dashboard (Esc)"
            className="px-3.5 py-2 bg-surface-hover text-text-muted hover:text-text-main rounded-lg border border-border-main transition-colors text-xs font-bold uppercase flex items-center gap-2"
          >
            <span>Dashboard</span>
            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-bg-dark border border-border-main text-text-muted">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
        {teamsWithStats.map(({ team, stats }, index) => (
          <div
            key={team.number}
            className="border border-border-main rounded-xl p-4 relative flex flex-col justify-between bg-bg-dark"
          >
            <button
              onClick={() => onRemoveTeam(team)}
              className="absolute top-3.5 right-3.5 text-text-muted hover:text-rose-400 transition-colors p-1"
              title="Remove from comparison"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className="px-2 py-0.5 text-lg font-montserrat font-black uppercase rounded-xs"
                  style={{ backgroundColor: colors[index], color: '#111111' }}
                >
                  #{team.number}
                </div>
                <div className="flex flex-col min-w-0 pr-6">
                  <span className="text-xs font-bold uppercase text-text-main truncate">
                    {team.name}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">
                    Rank #{team.rank} • {team.tier}
                  </span>
                </div>
              </div>

              {/* Core Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-main/60 text-xs">
                <div className="p-2 bg-surface rounded border border-border-main/50">
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Scout Score</span>
                  <span className="text-lg font-black font-montserrat text-accent">
                    {team.score}
                  </span>
                </div>

                <div className="p-2 bg-surface rounded border border-border-main/50">
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Statbotics EPA</span>
                  <span className="text-lg font-mono font-bold text-text-main">
                    {stats.epa.total}
                  </span>
                </div>

                <div className="p-2 bg-surface rounded border border-border-main/50">
                  <span className="text-[9px] uppercase font-bold text-text-muted block">OPR / DPR</span>
                  <span className="text-xs font-mono font-bold text-text-main">
                    {stats.opr} / {stats.dpr}
                  </span>
                </div>

                <div className="p-2 bg-surface rounded border border-border-main/50">
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Win Rate</span>
                  <span className="text-xs font-mono font-bold text-accent">
                    {stats.record.winRate}% ({stats.record.wins}W-{stats.record.losses}L)
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="mt-3 p-2 bg-surface rounded border border-border-main/50 text-[10px] space-y-1">
                <div className="text-text-main/80 font-mono truncate">
                  <span className="text-text-muted">Drive:</span> {stats.specs.drivetrain}
                </div>
                <div className="text-text-main/80 font-mono truncate">
                  <span className="text-text-muted">Motors:</span> {stats.specs.driveMotors}
                </div>
                <div className="text-text-main/80 font-mono truncate">
                  <span className="text-text-muted">Climb:</span> {stats.cycles.climbType} ({stats.cycles.climbSuccessPct}%)
                </div>
              </div>
            </div>

            {/* Prediction snippet */}
            <div className="mt-3 pt-2 border-t border-border-main/50 text-[10px] text-text-muted italic line-clamp-2">
              "{team.critique}"
            </div>
          </div>
        ))}

        {teams.length < 4 && (
          <div className="border border-dashed border-border-main rounded-xl p-6 flex flex-col items-center justify-center bg-surface/50 min-h-[220px]">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Add Team to Compare</h3>
            <div className="relative w-full max-w-[220px]">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Team # or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-main rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none focus:border-integra-yellow transition-colors text-text-main"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-main rounded-lg shadow-xl overflow-hidden z-20">
                  {searchResults.map((t) => (
                    <button
                      key={t.number}
                      onClick={() => {
                        onAddTeam(t);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-hover text-xs text-text-main border-b border-border-main last:border-b-0 flex items-center justify-between"
                    >
                      <span className="font-bold text-accent font-mono">#{t.number}</span>
                      <span className="truncate max-w-[130px]">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Radar Overlay Comparison */}
      {teams.length > 0 && (
        <div className="mt-6 border-t border-border-main pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-main mb-4 font-montserrat">
            Attribute Radar Comparison
          </h3>
          <div className="h-[340px] w-full bg-bg-dark rounded-xl border border-border-main p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke="#27272a" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={(props: any) => {
                    const { payload, x, y, textAnchor } = props;
                    const subjectVal = payload.value;
                    const matched = chartData.find((d) => d.subject === subjectVal);
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
                          fontSize={11}
                          fontFamily="Montserrat"
                          fontWeight={700}
                        >
                          {isHovered ? fullName : subjectVal}
                        </text>
                      </g>
                    );
                  }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                {teams.map((t, i) => (
                  <Radar
                    key={t.number}
                    name={`#${t.number} ${t.name}`}
                    dataKey={`Team${i}`}
                    stroke={colors[i]}
                    strokeWidth={2}
                    fill={colors[i]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
