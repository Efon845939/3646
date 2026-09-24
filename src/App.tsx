import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Search,
  Hexagon,
  Moon,
  Sun,
  Download,
  Swords,
  Keyboard,
  LayoutGrid,
  Table as TableIcon,
  ListOrdered,
  Scale,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { mockTeams, Team } from './data';
import { TeamCard } from './components/TeamCard';
import { TeamTableView } from './components/TeamTableView';
import { PicklistBoard } from './components/PicklistBoard';
import { QuickCompareBar } from './components/QuickCompareBar';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useGlobalShortcuts, AppView } from './hooks/useGlobalShortcuts';
import { usePicklist } from './hooks/usePicklist';
import { QUICK_FILTERS, QuickFilterId, HOST_TEAM_NUMBER, getQuickFilter } from './utils/quickFilters';
import { buildTeamsCsv, datedFilename, downloadCsv } from './utils/csvExport';
import { readStorage, writeStorage } from './utils/storage';

// The simulator (arena, physics loop, audio engine) is the heaviest screen and most visits
// never open it, so it is split into its own chunk and fetched on first use.
const MatchSimulator = lazy(() =>
  import('./components/MatchSimulator').then((m) => ({ default: m.MatchSimulator }))
);

// The team modal and compare view are the only screens that use the charting library, so
// they load as separate chunks too. Each loader is also called once the browser is idle
// (see the prefetch effect in App), so the first click on a team does not wait on the network.
const loadTeamModal = () => import('./components/TeamModal');
const loadTeamCompare = () => import('./components/TeamCompare');
const TeamModal = lazy(() => loadTeamModal().then((m) => ({ default: m.TeamModal })));
const TeamCompare = lazy(() => loadTeamCompare().then((m) => ({ default: m.TeamCompare })));

type SortOption = 'score-desc' | 'score-asc' | 'rank-asc' | 'rank-desc';
type ViewMode = 'grid' | 'table';

const hostTeam = mockTeams.find((t) => t.number === HOST_TEAM_NUMBER) || mockTeams[0];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('score-desc');
  const [activeFilter, setActiveFilter] = useState<QuickFilterId | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readStorage('integra_view_mode') === 'table' ? 'table' : 'grid'
  );
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [simInitialTeamA, setSimInitialTeamA] = useState<Team | null>(null);
  const [simInitialTeamB, setSimInitialTeamB] = useState<Team | null>(null);
  const [compareTeams, setCompareTeams] = useState<Team[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => readStorage('theme') !== 'light');

  const picklist = usePicklist();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    writeStorage('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    writeStorage('integra_view_mode', viewMode);
  }, [viewMode]);

  // Warm the lazily loaded screens once the dashboard has painted and the browser is idle.
  useEffect(() => {
    const prefetch = () => {
      void loadTeamModal();
      void loadTeamCompare();
    };
    // Older Safari has no requestIdleCallback; fall back to a short timer there.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 1500);
    return () => clearTimeout(id);
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const toggleView = (view: Exclude<AppView, 'dashboard'>) => {
    setActiveView((prev) => (prev === view ? 'dashboard' : view));
    setSelectedTeam(null);
  };

  const handleToggleCompare = (team: Team) => {
    setCompareTeams((prev) => {
      if (prev.some((t) => t.number === team.number)) {
        return prev.filter((t) => t.number !== team.number);
      }
      return prev.length >= 4 ? [...prev.slice(1), team] : [...prev, team];
    });
  };

  const handleOpenSimulator = (teamA?: Team | null, teamB?: Team | null) => {
    if (teamA && teamB) {
      setSimInitialTeamA(teamA);
      setSimInitialTeamB(teamB);
    } else if (teamA) {
      const topRival = mockTeams.find((t) => t.number === 1678) || mockTeams[1];
      setSimInitialTeamA(hostTeam);
      setSimInitialTeamB(teamA.number === hostTeam.number ? topRival : teamA);
    }
    setActiveView('simulator');
    setSelectedTeam(null);
  };

  const resetFilters = () => {
    setActiveFilter(null);
    setSearchQuery('');
    setSortBy('score-desc');
  };

  const toggleQuickFilter = (id: QuickFilterId) => {
    setActiveFilter((prev) => (prev === id ? null : id));
  };

  const filteredAndSortedTeams = useMemo(() => {
    let result = [...mockTeams];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.number.toString().includes(q) ||
          (t.location || '').toLowerCase().includes(q)
      );
    }

    if (activeFilter) {
      result = result.filter(getQuickFilter(activeFilter).matches);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return b.score - a.score || a.rank - b.rank;
        case 'score-asc':
          return a.score - b.score || b.rank - a.rank;
        case 'rank-asc':
          return a.rank - b.rank;
        case 'rank-desc':
          return b.rank - a.rank;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, sortBy, activeFilter]);

  // Exports exactly what is on screen: the current search, quick filter and sort order.
  const exportToCSV = () => {
    downloadCsv(datedFilename('integra-scouting'), buildTeamsCsv(filteredAndSortedTeams));
  };

  const highestScore = Math.max(...mockTeams.map((t) => t.score));
  const averageScore = (mockTeams.reduce((acc, t) => acc + t.score, 0) / mockTeams.length).toFixed(1);
  const picklistCount = picklist.lists.first.length + picklist.lists.second.length;

  useGlobalShortcuts({
    searchInputRef,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isTeamModalOpen: selectedTeam !== null,
    onCloseTeamModal: () => setSelectedTeam(null),
    activeView,
    onToggleView: toggleView,
    onCloseView: () => setActiveView('dashboard'),
    searchQuery,
    setSearchQuery,
    toggleTheme,
    exportToCSV,
    onToggleViewMode: () => setViewMode((prev) => (prev === 'grid' ? 'table' : 'grid')),
    onSelectSort: setSortBy,
    onToggleQuickFilter: toggleQuickFilter,
    onResetFilters: resetFilters,
  });

  return (
    <div className="min-h-screen bg-bg-dark text-text-main font-inter pb-20 transition-colors duration-300">
      {/* Navigation Header */}
      <nav className="flex flex-col lg:flex-row justify-between items-center py-3.5 border-b border-border-main mb-6 px-4 sm:px-6 bg-bg-dark/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveView('dashboard');
            resetFilters();
          }}
          className="flex items-center space-x-4 w-full lg:w-auto cursor-pointer group text-left"
          title="Back to dashboard & reset filters"
        >
          <div className="bg-integra-yellow text-[#111111] border-2 border-[#111111] px-2.5 py-0.5 text-2xl font-montserrat font-black uppercase rounded-xs group-hover:scale-105 transition-transform duration-200">
            #3646
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted tracking-widest uppercase font-bold">
              Pre-PR Scouting & Analytics
            </span>
            <span className="text-base sm:text-lg font-black font-montserrat tracking-tight text-text-main">
              INTEGRA SCOUTING
            </span>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-3 lg:mt-0 w-full lg:w-auto justify-end">
          {/* View Mode Toggle Button */}
          <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border-main text-sm font-bold uppercase">
            {(
              [
                { mode: 'grid', label: 'Grid', icon: LayoutGrid, title: 'Card Grid View (Shortcut: V)' },
                { mode: 'table', label: 'Table', icon: TableIcon, title: 'Table Analytics View (Shortcut: V)' },
              ] as const
            ).map(({ mode, label, icon: Icon, title }) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode);
                  setActiveView('dashboard');
                }}
                aria-pressed={viewMode === mode}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === mode && activeView === 'dashboard'
                    ? 'bg-integra-yellow text-[#111111] font-black'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title={title}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <NavViewButton
            id="nav-btn-simulator"
            active={activeView === 'simulator'}
            onClick={() => toggleView('simulator')}
            icon={Swords}
            label="Simulator"
            shortcut="M"
            title="FRC Match Simulator (Shortcut: M)"
          />
          <NavViewButton
            id="nav-btn-compare"
            active={activeView === 'compare'}
            onClick={() => toggleView('compare')}
            icon={Scale}
            label={`Compare${compareTeams.length > 0 ? ` (${compareTeams.length})` : ''}`}
            shortcut="C"
            title="Compare Mode (Shortcut: C)"
          />
          <NavViewButton
            id="nav-btn-picklist"
            active={activeView === 'picklist'}
            onClick={() => toggleView('picklist')}
            icon={ListOrdered}
            label={`Picklist${picklistCount > 0 ? ` (${picklistCount})` : ''}`}
            shortcut="P"
            title="Alliance Selection Picklist (Shortcut: P)"
          />

          {/* Export CSV */}
          <button
            id="nav-btn-export-csv"
            onClick={exportToCSV}
            aria-keyshortcuts="E"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1"
            title={`Export ${filteredAndSortedTeams.length} filtered teams to CSV (Shortcut: E)`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            id="nav-btn-theme-toggle"
            onClick={toggleTheme}
            aria-keyshortcuts="T"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted transition-colors flex items-center justify-center gap-1"
            title={`Toggle Theme (Shortcut: T) - Currently ${isDark ? 'Dark' : 'Light'}`}
          >
            {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-text-main" />}
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            id="nav-btn-shortcuts-help"
            onClick={() => setIsShortcutsOpen(true)}
            aria-keyshortcuts="?"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1"
            title="Keyboard Shortcuts (Shortcut: ?)"
          >
            <Keyboard className="w-4 h-4 text-accent" />
          </button>

          {/* Team Search Input */}
          <div className="bg-surface p-2 rounded-lg border border-border-main flex items-center space-x-2 w-full lg:w-72 relative transition-colors duration-200 focus-within:border-accent">
            <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
            <input
              id="main-search-input"
              ref={searchInputRef}
              type="text"
              aria-keyshortcuts="/"
              aria-label="Search teams"
              placeholder="Search team #, name, city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'dashboard') setActiveView('dashboard');
              }}
              className="bg-transparent outline-none text-sm w-full pl-6 pr-10 placeholder-text-muted text-text-main"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="text-text-muted hover:text-text-main p-0.5 rounded text-xs leading-none"
                  title="Clear search (Esc)"
                >
                  ✕
                </button>
              )}
              <kbd
                onClick={() => {
                  searchInputRef.current?.focus();
                  searchInputRef.current?.select();
                }}
                className="hidden sm:inline-flex items-center justify-center text-[9px] font-mono px-1.5 py-0.5 rounded bg-bg-dark border border-border-main text-text-muted cursor-pointer hover:border-text-muted hover:text-text-main select-none"
                title="Press / to focus search"
              >
                /
              </kbd>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {activeView === 'simulator' ? (
          <Suspense fallback={<ViewLoader label="Loading match simulator…" />}>
            <MatchSimulator
              onClose={() => setActiveView('dashboard')}
              initialTeamA={simInitialTeamA}
              initialTeamB={simInitialTeamB}
            />
          </Suspense>
        ) : activeView === 'compare' ? (
          <Suspense fallback={<ViewLoader label="Loading team comparison…" />}>
            <TeamCompare
              teams={compareTeams}
              onAddTeam={(t) => setCompareTeams((prev) => [...prev, t])}
              onRemoveTeam={(t) => setCompareTeams((prev) => prev.filter((ct) => ct.number !== t.number))}
              onClose={() => setActiveView('dashboard')}
              onOpenSimulator={(teamA, teamB) => handleOpenSimulator(teamA, teamB)}
            />
          </Suspense>
        ) : activeView === 'picklist' ? (
          <PicklistBoard
            picklist={picklist}
            onClose={() => setActiveView('dashboard')}
            onSelectTeam={setSelectedTeam}
            onOpenSimulator={handleOpenSimulator}
          />
        ) : (
          <>
            {/* KPI Stats Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard label="Teams Scouted" value={mockTeams.length} />
              <button
                type="button"
                onClick={() => setSelectedTeam(hostTeam)}
                className="text-left bg-surface hover:bg-surface-hover p-5 rounded-2xl border border-border-main border-l-4 border-l-integra-yellow transition-colors duration-200"
                title="Open #3646 scouting profile"
              >
                <div className="text-text-muted text-xs uppercase font-bold tracking-wider">Host Team</div>
                <div className="text-3xl font-montserrat font-black mt-1 text-text-main">#3646 IntegrA</div>
              </button>
              <KpiCard label="Peak Pre-PR Score" value={highestScore} accent />
              <KpiCard label="Average Score" value={averageScore} />
            </div>

            {/* Quick Sort & Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-1 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip
                  id="filter-btn-score-high"
                  active={sortBy === 'score-desc'}
                  onClick={() => setSortBy('score-desc')}
                  shortcut="1"
                  title="Sort: Highest Score (Shortcut: 1)"
                >
                  Score: High
                </FilterChip>
                <FilterChip
                  id="filter-btn-score-low"
                  active={sortBy === 'score-asc'}
                  onClick={() => setSortBy('score-asc')}
                  shortcut="2"
                  title="Sort: Lowest Score (Shortcut: 2)"
                >
                  Score: Low
                </FilterChip>

                {QUICK_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <FilterChip
                      key={filter.id}
                      id={`filter-btn-${filter.id}`}
                      active={isActive}
                      onClick={() => toggleQuickFilter(filter.id)}
                      shortcut={filter.shortcut}
                      title={`${filter.description} (Shortcut: ${filter.shortcut})`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#111111]' : filter.iconClass}`} />
                      <span>{filter.label}</span>
                    </FilterChip>
                  );
                })}

                {(activeFilter || searchQuery) && (
                  <button
                    id="filter-btn-clear"
                    onClick={resetFilters}
                    aria-keyshortcuts="0"
                    title="Reset All Filters (Shortcut: 0)"
                    className="text-sm text-text-muted hover:text-text-main underline ml-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="text-sm text-text-muted">
                Showing <span className="font-bold text-text-main">{filteredAndSortedTeams.length}</span> teams
              </div>
            </div>

            {/* Main Teams Presentation: Grid View vs Table View */}
            {filteredAndSortedTeams.length > 0 ? (
              viewMode === 'grid' ? (
                <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredAndSortedTeams.map((team, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 12) * 0.03, duration: 0.25 }}
                      key={team.number}
                      onClick={() => setSelectedTeam(team)}
                      className="cursor-pointer h-full transition-transform hover:-translate-y-0.5"
                    >
                      <TeamCard
                        team={team}
                        isSelectedForCompare={compareTeams.some((t) => t.number === team.number)}
                        onToggleCompare={handleToggleCompare}
                        compareIndex={compareTeams.findIndex((t) => t.number === team.number)}
                        picklistLane={picklist.laneByTeam.get(team.number) ?? null}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <TeamTableView
                  teams={filteredAndSortedTeams}
                  selectedCompareTeams={compareTeams}
                  onToggleCompare={handleToggleCompare}
                  onSelectTeam={setSelectedTeam}
                  onOpenSimulator={(t) => handleOpenSimulator(t)}
                  laneByTeam={picklist.laneByTeam}
                />
              )
            ) : (
              <div className="text-center py-20 bg-surface rounded-xl border border-border-main transition-colors duration-200">
                <Hexagon className="w-12 h-12 text-border-main mx-auto mb-4" />
                <h3 className="text-lg font-montserrat font-bold text-text-muted">No teams found</h3>
                <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search query.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-3 py-1.5 rounded-lg border border-border-main bg-bg-dark text-xs font-bold uppercase text-text-muted hover:text-text-main"
                >
                  Reset filters (0)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
              <Loader2 className="w-6 h-6 animate-spin text-integra-yellow" aria-label="Loading team profile" />
            </div>
          }
        >
          <TeamModal
            team={selectedTeam}
            onClose={() => setSelectedTeam(null)}
            isSelectedForCompare={compareTeams.some((t) => t.number === selectedTeam.number)}
            onToggleCompare={handleToggleCompare}
            onOpenSimulator={handleOpenSimulator}
            picklistLane={picklist.laneByTeam.get(selectedTeam.number) ?? null}
            onSetPicklistLane={(team, lane) => picklist.moveTeam(team.number, lane)}
          />
        </Suspense>
      )}

      {/* Floating Quick Compare Bar appears when at least 2 teams are selected */}
      {activeView === 'dashboard' && (
        <QuickCompareBar
          selectedTeams={compareTeams}
          onRemoveTeam={handleToggleCompare}
          onClearAll={() => setCompareTeams([])}
          onOpenCompare={() => {
            setActiveView('compare');
            setSelectedTeam(null);
          }}
          onOpenSimulator={(teamA, teamB) => handleOpenSimulator(teamA, teamB)}
        />
      )}

      {/* Floating Keyboard Shortcuts Guide Trigger (Bottom Left) */}
      <button
        id="btn-floating-shortcuts-guide"
        onClick={() => setIsShortcutsOpen(true)}
        aria-keyshortcuts="?"
        className="fixed bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-surface/90 hover:bg-surface backdrop-blur-md border border-border-main hover:border-integra-yellow/60 text-text-muted hover:text-text-main shadow-lg transition-all text-xs group"
        title="Keyboard Shortcuts Guide (Shortcut: ?)"
      >
        <Keyboard className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
        <span className="font-medium">Shortcuts</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-bg-dark border border-border-main text-text-muted group-hover:text-accent">
          ?
        </kbd>
      </button>

      {/* Global Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}

function KpiCard({ label, value, accent = false }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-surface p-5 rounded-2xl border border-border-main transition-colors duration-200">
      <div className="text-text-muted text-xs uppercase font-bold tracking-wider">{label}</div>
      <div className={`text-3xl font-montserrat font-black mt-1 ${accent ? 'text-accent' : 'text-text-main'}`}>{value}</div>
    </div>
  );
}

function ViewLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-text-muted font-mono uppercase tracking-wider bg-surface border border-border-main rounded-xl">
      <Loader2 className="w-4 h-4 animate-spin text-accent" />
      {label}
    </div>
  );
}

function NavViewButton({
  id,
  active,
  onClick,
  icon: Icon,
  label,
  shortcut,
  title,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  shortcut: string;
  title: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      className={`px-3.5 py-2 rounded-lg border transition-colors flex items-center justify-center font-bold text-sm gap-2 uppercase ${
        active
          ? 'bg-integra-yellow text-[#111111] border-integra-yellow'
          : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border-border-main'
      }`}
      title={title}
    >
      {/* Icon switches to black on the active yellow background, otherwise it disappears. */}
      <Icon className={`w-4 h-4 ${active ? 'text-[#111111]' : 'text-accent'}`} />
      <span>{label}</span>
    </button>
  );
}

function FilterChip({
  id,
  active,
  onClick,
  shortcut,
  title,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  shortcut: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      title={title}
      className={`px-4 py-1.5 rounded-full border text-sm transition-colors font-semibold flex items-center gap-2 ${
        active
          ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
          : 'border-border-main text-text-muted hover:text-text-main bg-surface'
      }`}
    >
      {children}
    </button>
  );
}
