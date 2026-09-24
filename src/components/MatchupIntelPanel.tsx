import React, { useMemo, useState } from 'react';
import { Crosshair, ShieldAlert, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Team, mockTeams } from '../data';
import { generateMatchupTactics, MatchupTacticsIntel, ProactiveMatchupTactic } from '../utils/teamArchetypes';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';

const THREAT_CLASS: Record<MatchupTacticsIntel['threatLevel'], string> = {
  CRITICAL: 'bg-rose-500/15 text-rose-500 border-rose-500/40',
  HIGH: 'bg-amber-500/15 text-amber-500 border-amber-500/40',
  MODERATE: 'bg-sky-500/15 text-sky-500 border-sky-500/40',
  MANAGEABLE: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40',
};

const IMPACT_CLASS: Record<ProactiveMatchupTactic['impact'], string> = {
  'GAME CHANGER': 'bg-integra-yellow text-[#111111] border-integra-yellow',
  'CRITICAL COUNTER': 'bg-rose-500/15 text-rose-500 border-rose-500/40',
  'HIGH VALUE': 'bg-sky-500/15 text-sky-500 border-sky-500/40',
};

const hostTeam = mockTeams.find((t) => t.number === HOST_TEAM_NUMBER)!;
const rivalsByEPA = mockTeams
  .filter((t) => t.number !== HOST_TEAM_NUMBER)
  .sort((a, b) => (b.frcStats?.epa.total ?? 0) - (a.frcStats?.epa.total ?? 0));

export function MatchupIntelPanel({ team }: { team: Team }) {
  const isHost = team.number === HOST_TEAM_NUMBER;
  // Viewing our own profile: pick an opponent to scout against (defaults to the top EPA rival).
  const [rivalNumber, setRivalNumber] = useState(rivalsByEPA[0].number);
  const rival = isHost ? rivalsByEPA.find((t) => t.number === rivalNumber)! : team;

  const intel = useMemo(() => generateMatchupTactics(hostTeam, rival), [rival]);
  const winPct = intel.winProbabilityEstimate;

  return (
    <div className="bg-bg-dark rounded-xl border border-border-main p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-accent" />
          <span>
            Matchup Intel · #{HOST_TEAM_NUMBER} vs #{rival.number}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {isHost && (
            <select
              value={rivalNumber}
              onChange={(e) => setRivalNumber(Number(e.target.value))}
              aria-label="Opponent to analyse"
              className="bg-surface border border-border-main rounded px-2 py-1 text-xs text-text-main outline-none focus:border-accent"
            >
              {rivalsByEPA.map((t) => (
                <option key={t.number} value={t.number}>
                  #{t.number} {t.name} (EPA {t.frcStats?.epa.total})
                </option>
              ))}
            </select>
          )}
          <span
            className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${THREAT_CLASS[intel.threatLevel]}`}
          >
            <ShieldAlert className="w-3 h-3" />
            {intel.threatLevel} threat
          </span>
        </div>
      </div>

      {/* EPA win probability bar (same logistic model as the match simulator) */}
      <div>
        <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
          <span className="text-accent">#{HOST_TEAM_NUMBER} win {winPct}%</span>
          <span className="text-text-muted uppercase tracking-wider">1v1 EPA model</span>
          <span className="text-rose-500">#{rival.number} win {100 - winPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-surface border border-border-main">
          <div className="bg-integra-yellow" style={{ width: `${winPct}%` }} />
          <div className="bg-rose-500/70 flex-1" />
        </div>
      </div>

      {/* Archetypes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: `#${HOST_TEAM_NUMBER} IntegrA`, info: intel.allyArchetype },
          { label: `#${rival.number} ${rival.name}`, info: intel.rivalArchetype },
        ].map(({ label, info }) => (
          <div key={label} className="p-3 bg-surface rounded-lg border border-border-main space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-main truncate">{label}</span>
              <span
                className={`shrink-0 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${info.bgLightColor} ${info.badgeColor} ${info.borderColor}`}
              >
                {info.coreArchetype}
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-snug">{info.description}</p>
            <ul className="text-[10px] text-text-muted font-mono space-y-0.5">
              {info.scoutingHighlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Head-to-head deltas */}
      <div className="rounded-lg border border-border-main overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface text-[10px] uppercase tracking-wider text-text-muted">
              <th className="text-left font-bold px-3 py-1.5">Metric</th>
              <th className="text-right font-bold px-3 py-1.5">#{HOST_TEAM_NUMBER}</th>
              <th className="text-center font-bold px-2 py-1.5 w-10">Edge</th>
              <th className="text-left font-bold px-3 py-1.5">#{rival.number}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/60 font-mono">
            {intel.matchupDeltas.map((d) => (
              <tr key={d.label}>
                <td className="px-3 py-1.5 font-sans text-text-muted">{d.label}</td>
                <td className={`px-3 py-1.5 text-right font-bold ${d.advantage === 'ally' ? 'text-accent' : 'text-text-main'}`}>
                  {d.allyVal}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {d.advantage === 'ally' ? (
                    <ArrowUp className="w-3.5 h-3.5 inline text-emerald-500" aria-label="IntegrA advantage" />
                  ) : d.advantage === 'rival' ? (
                    <ArrowDown className="w-3.5 h-3.5 inline text-rose-500" aria-label="Rival advantage" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 inline text-text-muted" aria-label="Even" />
                  )}
                </td>
                <td className={`px-3 py-1.5 font-bold ${d.advantage === 'rival' ? 'text-rose-500' : 'text-text-main'}`}>
                  {d.rivalVal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phase-by-phase game plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {intel.proactiveTactics.map((tactic) => (
          <div key={tactic.id} className="p-3 bg-surface rounded-lg border border-border-main space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-text-muted">{tactic.phase}</span>
              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${IMPACT_CLASS[tactic.impact]}`}>
                {tactic.impact}
              </span>
            </div>
            <div className="text-xs font-bold text-text-main">{tactic.title}</div>
            <p className="text-[11px] text-text-muted leading-snug">{tactic.summary}</p>
            <p className="text-[11px] text-text-main leading-snug border-l-2 border-integra-yellow pl-2">
              {tactic.recommendedAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
