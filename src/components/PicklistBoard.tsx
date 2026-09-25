import React, { useMemo, useState } from 'react';
import {
  ListOrdered,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  Trash2,
  Search,
  Swords,
  FileText,
  Users,
} from 'lucide-react';
import { Team, mockTeams } from '../data';
import { PICKLIST_LANES, PICKLIST_LANE_META, PicklistApi, PicklistLane } from '../hooks/usePicklist';
import { deriveCoreArchetype, FRCCoreArchetype } from '../utils/teamArchetypes';
import { HOST_TEAM_NUMBER } from '../utils/quickFilters';
import { formatRecord, getRealMetrics, winRateOf } from '../utils/realMetrics';
import { readScoutNotes } from '../utils/storage';
import { datedFilename, downloadCsv } from '../utils/csvExport';

interface PicklistBoardProps {
  picklist: PicklistApi;
  onClose: () => void;
  onSelectTeam: (team: Team) => void;
  onOpenSimulator: (teamA?: Team | null, teamB?: Team | null) => void;
}

type DropZone = PicklistLane | 'pool';
type PoolSort = 'opr' | 'win' | 'score';

// Short labels keep a lane row on two lines even in the narrow four-column layout.
const ARCHETYPE_SHORT: Record<FRCCoreArchetype, string> = {
  Defender: 'DEF',
  'Cycle-focused': 'CYCLE',
  'All-rounder': 'ALL-ROUND',
  'Long-range Sniper': 'SNIPER',
  'Feeder / Shuttle': 'FEEDER',
};

const teamByNumber = new Map(mockTeams.map((t) => [t.number, t]));
const archetypeByTeam = new Map(mockTeams.map((t) => [t.number, deriveCoreArchetype(t)]));
const hostTeam = teamByNumber.get(HOST_TEAM_NUMBER)!;
// Real best-event OPR. An alliance's OPR sum is the standard estimate of its match score.
const oprOf = (t: Team) => getRealMetrics(t.number)?.bestOpr ?? 0;
const sumOpr = (teams: Team[]) => Math.round(teams.reduce((acc, t) => acc + oprOf(t), 0) * 10) / 10;

const POOL_SORTS: Record<PoolSort, { label: string; value: (t: Team) => number }> = {
  opr: { label: 'Best OPR', value: oprOf },
  win: { label: 'Win Rate', value: (t) => winRateOf(getRealMetrics(t.number)?.record ?? null) ?? 0 },
  score: { label: 'Pre-PR Score', value: (t) => t.score },
};

export function PicklistBoard({ picklist, onClose, onSelectTeam, onOpenSimulator }: PicklistBoardProps) {
  const { lists, laneByTeam, moveTeam, shiftTeam, clearPicklist } = picklist;
  const [poolQuery, setPoolQuery] = useState('');
  const [poolSort, setPoolSort] = useState<PoolSort>('opr');
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ zone: DropZone; before: number | null } | null>(null);

  const pool = useMemo(() => {
    const q = poolQuery.trim().toLowerCase();
    const sortValue = POOL_SORTS[poolSort].value;
    return mockTeams
      .filter((t) => t.number !== HOST_TEAM_NUMBER && !laneByTeam.has(t.number))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || String(t.number).includes(q))
      .sort((a, b) => sortValue(b) - sortValue(a));
  }, [laneByTeam, poolQuery, poolSort]);

  // Our projected alliance is the captain plus the top name on each pick lane. The rival
  // benchmark is the strongest OPR trio left once those three are off the board.
  const projection = useMemo(() => {
    const picks = [lists.first[0], lists.second[0]]
      .filter((n): n is number => n !== undefined)
      .map((n) => teamByNumber.get(n)!);
    const ours = [hostTeam, ...picks];
    const taken = new Set(ours.map((t) => t.number));
    const rivals = mockTeams
      .filter((t) => !taken.has(t.number))
      .sort((a, b) => oprOf(b) - oprOf(a))
      .slice(0, 3);
    const ourOpr = sumOpr(ours);
    const rivalOpr = sumOpr(rivals);
    // A 1- or 2-robot alliance against a full trio says nothing useful, so only compare
    // predicted scores once both picks are set.
    const isComplete = ours.length === 3;
    return { ours, rivals, ourOpr, rivalOpr, isComplete, margin: Math.round((ourOpr - rivalOpr) * 10) / 10 };
  }, [lists]);

  const handleDrop = (e: React.DragEvent, zone: DropZone, before: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = Number(e.dataTransfer.getData('text/plain')) || dragging;
    if (dragged && dragged !== before) {
      moveTeam(dragged, zone === 'pool' ? null : zone, before);
    }
    setDragging(null);
    setDropTarget(null);
  };

  const zoneHandlers = (zone: DropZone) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (dropTarget?.zone !== zone || dropTarget.before !== null) setDropTarget({ zone, before: null });
    },
    onDrop: (e: React.DragEvent) => handleDrop(e, zone, null),
  });

  const exportPicklist = () => {
    const rows: (string | number)[][] = [
      ['Lane', 'Order', 'Team', 'Name', 'Best OPR', 'Record', 'Win %', 'Best Event Rank', 'Archetype', 'Scout Notes'],
    ];
    for (const lane of PICKLIST_LANES) {
      lists[lane].forEach((n, idx) => {
        const t = teamByNumber.get(n)!;
        const real = getRealMetrics(n);
        rows.push([
          PICKLIST_LANE_META[lane].label,
          idx + 1,
          t.number,
          t.name,
          real?.bestOpr ?? '',
          formatRecord(real?.record ?? null),
          winRateOf(real?.record ?? null) ?? '',
          real?.bestEventRank ?? '',
          archetypeByTeam.get(n)!.coreArchetype,
          readScoutNotes(n),
        ]);
      });
    }
    downloadCsv(datedFilename('integra-picklist'), rows);
  };

  const totalListed = lists.first.length + lists.second.length + lists.dnp.length;

  const renderRow = (team: Team, zone: DropZone, index: number | null) => {
    const real = getRealMetrics(team.number);
    const archetype = archetypeByTeam.get(team.number)!;
    const isDropBefore = dropTarget?.zone === zone && dropTarget.before === team.number && dragging !== team.number;
    const lane = zone === 'pool' ? null : zone;
    const list = lane ? lists[lane] : [];
    const hasNotes = readScoutNotes(team.number) !== '';

    return (
      <li
        key={team.number}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', String(team.number));
          e.dataTransfer.effectAllowed = 'move';
          setDragging(team.number);
        }}
        onDragEnd={() => {
          setDragging(null);
          setDropTarget(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Pool order is computed, so dropping there only means "remove from picklist".
          const before = zone === 'pool' ? null : team.number;
          if (dropTarget?.zone !== zone || dropTarget.before !== before) {
            setDropTarget({ zone, before });
          }
        }}
        onDrop={(e) => handleDrop(e, zone, zone === 'pool' ? null : team.number)}
        title={`${archetype.coreArchetype} · best event rank ${real?.bestEventRank ? `#${real.bestEventRank}` : '—'}`}
        className={`group rounded-lg border bg-surface px-2 py-1.5 transition-colors cursor-grab active:cursor-grabbing ${
          dragging === team.number ? 'opacity-40' : ''
        } ${isDropBefore ? 'border-t-2 border-t-accent border-border-main' : 'border-border-main hover:border-text-muted/50'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-text-muted/60 shrink-0" aria-hidden="true" />
          {index !== null && (
            <span className="w-5 text-xs font-mono font-bold text-text-muted text-right shrink-0">{index + 1}.</span>
          )}
          <button
            type="button"
            onClick={() => onSelectTeam(team)}
            className="flex items-baseline gap-1.5 min-w-0 text-left hover:text-accent transition-colors"
            title="Open scouting profile"
          >
            <span className="font-montserrat font-black text-sm text-text-main shrink-0">#{team.number}</span>
            <span className="text-sm text-text-muted truncate">{team.name}</span>
          </button>
          {hasNotes && <FileText className="w-3 h-3 text-accent shrink-0" aria-label="Has scout notes" />}
          <span className="ml-auto font-mono text-sm font-bold text-accent shrink-0" title="Best 2026 event OPR">
            {real?.bestOpr ?? '—'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1 pl-5 min-w-0">
          <span
            className={`shrink-0 px-1 py-px rounded border text-[11px] font-black uppercase ${archetype.bgLightColor} ${archetype.badgeColor} ${archetype.borderColor}`}
          >
            {ARCHETYPE_SHORT[archetype.coreArchetype]}
          </span>
          <span className="text-xs font-mono text-text-muted whitespace-nowrap">{formatRecord(real?.record ?? null)}</span>

          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            {lane && index !== null && (
              <>
                <IconButton label="Move up" disabled={index === 0} onClick={() => shiftTeam(team.number, -1)}>
                  <ChevronUp className="w-3 h-3" />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={index === list.length - 1}
                  onClick={() => shiftTeam(team.number, 1)}
                >
                  <ChevronDown className="w-3 h-3" />
                </IconButton>
              </>
            )}
            {PICKLIST_LANES.filter((l) => l !== lane).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => moveTeam(team.number, l)}
                className="px-1 py-px rounded border border-border-main text-xs font-bold uppercase text-text-muted hover:text-text-main hover:border-text-muted transition-colors"
                title={`Move to ${PICKLIST_LANE_META[l].label}`}
              >
                {l === 'first' ? '1st' : l === 'second' ? '2nd' : 'DNP'}
              </button>
            ))}
            {lane && (
              <IconButton label="Remove from picklist" onClick={() => moveTeam(team.number, null)}>
                <X className="w-3 h-3" />
              </IconButton>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-border-main">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-integra-yellow text-[#111111]">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-montserrat uppercase text-text-main">Alliance Picklist</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Drag teams between lanes or use the buttons (touch & keyboard friendly). Saved in this browser.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportPicklist}
            disabled={totalListed === 0}
            className="px-3 py-1.5 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-xs font-bold uppercase text-text-muted hover:text-text-main flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear the whole picklist? This cannot be undone.')) clearPicklist();
            }}
            disabled={totalListed === 0}
            className="px-3 py-1.5 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-xs font-bold uppercase text-text-muted hover:text-rose-500 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-xs font-bold uppercase text-text-muted hover:text-text-main flex items-center gap-1.5 transition-colors"
          >
            Dashboard
            <kbd className="text-xs font-mono px-1 rounded bg-bg-dark border border-border-main">Esc</kbd>
          </button>
        </div>
      </div>

      {/* Alliance projection */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <AllianceSummary
          title="Projected IntegrA Alliance"
          teams={projection.ours}
          opr={projection.ourOpr}
          tone="ours"
          onSelectTeam={onSelectTeam}
        />
        <div className="flex lg:flex-col items-center justify-center gap-2 px-4 py-3 bg-surface border border-border-main rounded-xl">
          <span className="text-xs uppercase font-bold tracking-wider text-text-muted">Predicted margin</span>
          {projection.isComplete ? (
            <span
              className={`text-3xl font-montserrat font-black ${projection.margin >= 0 ? 'text-accent' : 'text-rose-500'}`}
              title="Our OPR sum minus theirs: the expected difference in match score"
            >
              {projection.margin >= 0 ? '+' : ''}
              {projection.margin}
            </span>
          ) : (
            <span className="text-center text-sm text-text-muted leading-tight">
              <span className="block text-3xl font-montserrat font-black text-text-muted">—</span>
              Set a 1st & 2nd pick
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpenSimulator(hostTeam, projection.rivals[0])}
            className="px-2 py-1 rounded border border-integra-yellow/50 text-accent text-xs font-bold uppercase flex items-center gap-1 hover:bg-surface-hover"
            title="Open the match simulator with these captains"
          >
            <Swords className="w-3 h-3" /> Simulate
          </button>
        </div>
        <AllianceSummary
          title="Strongest Remaining Trio"
          teams={projection.rivals}
          opr={projection.rivalOpr}
          tone="rival"
          onSelectTeam={onSelectTeam}
        />
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        <section
          {...zoneHandlers('pool')}
          aria-label="Available teams"
          className={`bg-bg-dark border rounded-xl p-3 flex flex-col gap-2 ${
            dropTarget?.zone === 'pool' ? 'border-accent' : 'border-border-main'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" /> Available
            </span>
            <span className="text-xs font-mono text-text-muted">{pool.length}</span>
          </div>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-text-muted absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={poolQuery}
                onChange={(e) => setPoolQuery(e.target.value)}
                placeholder="Filter…"
                aria-label="Filter available teams"
                className="w-full bg-surface border border-border-main rounded-md pl-6 pr-2 py-1 text-xs text-text-main placeholder-text-muted outline-none focus:border-accent"
              />
            </div>
            <select
              value={poolSort}
              onChange={(e) => setPoolSort(e.target.value as PoolSort)}
              aria-label="Sort available teams"
              className="bg-surface border border-border-main rounded-md px-1.5 text-sm text-text-main outline-none focus:border-accent"
            >
              {Object.entries(POOL_SORTS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <ul className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {pool.map((team) => renderRow(team, 'pool', null))}
            {pool.length === 0 && (
              <li className="text-sm text-text-muted text-center py-6">No teams match.</li>
            )}
          </ul>
        </section>

        {PICKLIST_LANES.map((lane) => (
          <section
            key={lane}
            {...zoneHandlers(lane)}
            aria-label={PICKLIST_LANE_META[lane].label}
            className={`bg-bg-dark border rounded-xl p-3 flex flex-col gap-2 min-h-[220px] ${
              dropTarget?.zone === lane ? 'border-accent' : 'border-border-main'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded border text-xs font-black uppercase tracking-wider ${PICKLIST_LANE_META[lane].badgeClass}`}
              >
                {PICKLIST_LANE_META[lane].label}
              </span>
              <span className="text-xs font-mono text-text-muted">{lists[lane].length}</span>
            </div>
            <ul className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-0.5 pb-6">
              {lists[lane].map((n, idx) => renderRow(teamByNumber.get(n)!, lane, idx))}
            </ul>
            {lists[lane].length === 0 && (
              <p className="text-sm text-text-muted text-center border border-dashed border-border-main rounded-lg py-8 px-3">
                Drag teams here or use the <span className="font-bold">{lane === 'first' ? '1st' : lane === 'second' ? '2nd' : 'DNP'}</span> button.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="p-0.5 rounded border border-transparent text-text-muted hover:text-text-main hover:border-border-main transition-colors disabled:opacity-25 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

function AllianceSummary({
  title,
  teams,
  opr,
  tone,
  onSelectTeam,
}: {
  title: string;
  teams: Team[];
  opr: number;
  tone: 'ours' | 'rival';
  onSelectTeam: (team: Team) => void;
}) {
  const roles = ['Captain', '1st Pick', '2nd Pick'];
  return (
    <div
      className={`bg-surface border border-border-main rounded-xl p-3 border-l-4 ${
        tone === 'ours' ? 'border-l-integra-yellow' : 'border-l-rose-500'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-bold tracking-wider text-text-muted">{title}</span>
        <span className={`font-mono text-sm font-black ${tone === 'ours' ? 'text-accent' : 'text-rose-500'}`}>
          {opr} OPR
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((role, idx) => {
          const team = teams[idx];
          return (
            <button
              key={role}
              type="button"
              disabled={!team}
              onClick={() => team && onSelectTeam(team)}
              className="text-left p-1.5 rounded-lg bg-bg-dark border border-border-main hover:border-text-muted/60 disabled:hover:border-border-main transition-colors min-w-0"
            >
              <span className="block text-xs uppercase font-bold text-text-muted">
                {tone === 'ours' ? role : `#${idx + 1} OPR`}
              </span>
              {team ? (
                <>
                  <span className="block font-montserrat font-black text-sm text-text-main">#{team.number}</span>
                  <span className="block text-xs font-mono text-text-muted truncate">{oprOf(team)} OPR</span>
                </>
              ) : (
                <span className="block text-sm text-text-muted italic py-1">Not set</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
