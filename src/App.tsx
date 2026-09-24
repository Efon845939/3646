import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Filter,
  ArrowUpDown,
  Trophy,
  ShieldAlert,
  Palette,
  Award,
} from 'lucide-react';
import { motion } from 'motion/react';
import { mockTeams, Team } from './data';
import { TeamCard } from './components/TeamCard';
import { TeamTableView } from './components/TeamTableView';
import { TeamModal } from './components/TeamModal';
import { TeamCompare } from './components/TeamCompare';
import { MatchSimulator } from './components/MatchSimulator';
import { QuickCompareBar } from './components/QuickCompareBar';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

type SortOption = 'score-desc' | 'score-asc' | 'rank-asc' | 'rank-desc';
type FilterTag = 'All' | 'Impact Winner' | 'Most Creative' | 'High Threat' | 'Best Branding';
type ViewMode = 'grid' | 'table';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('score-desc');
  const [filterTag, setFilterTag] = useState<FilterTag>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [simInitialTeamA, setSimInitialTeamA] = useState<Team | null>(null);
  const [simInitialTeamB, setSimInitialTeamB] = useState<Team | null>(null);
  const [compareTeams, setCompareTeams] = useState<Team[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleCompare = (team: Team) => {
    setCompareTeams((prev) => {
      const exists = prev.some((t) => t.number === team.number);
      if (exists) {
        return prev.filter((t) => t.number !== team.number);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), team];
        }
        return [...prev, team];
      }
    });
  };

  const handleClearCompare = () => {
    setCompareTeams([]);
  };

  const handleOpenCompare = () => {
    setIsCompareMode(true);
    setIsSimulatorMode(false);
    setSelectedTeam(null);
  };

  const handleOpenSimulator = (teamA?: Team | null, teamB?: Team | null) => {
    const integra = mockTeams.find((t) => t.number === 3646) || mockTeams[0];
    if (teamA && teamB) {
      setSimInitialTeamA(teamA);
      setSimInitialTeamB(teamB);
    } else if (teamA) {
      if (teamA.number === integra.number) {
        const topRival = mockTeams.find((t) => t.number === 1678) || mockTeams[1];
        setSimInitialTeamA(integra);
        setSimInitialTeamB(topRival);
      } else {
        setSimInitialTeamA(integra);
        setSimInitialTeamB(teamA);
      }
    }
    setIsSimulatorMode(true);
    setIsCompareMode(false);
    setSelectedTeam(null);
  };

  const [isDark, setIsDark] = useState(() => {
    return localStorage.theme === 'light' ? false : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const filteredAndSortedTeams = useMemo(() => {
    let result = [...mockTeams];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.number.toString().includes(q)
      );
    }

    if (filterTag !== 'All') {
      result = result.filter((t) => t.tags.includes(filterTag));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'rank-asc':
          return a.rank - b.rank;
        case 'rank-desc':
          return b.rank - a.rank;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, sortBy, filterTag]);

  const exportToCSV = () => {
    const headers = [
      'Number',
      'Name',
      'Score',
      'Rank',
      'Tier',
      'Pros',
      'Cons',
      'Critique',
      'Prediction',
      'Counter Play',
    ];
    const rows = mockTeams.map((t) => [
      t.number,
      `"${t.name}"`,
      t.score,
      t.rank,
      t.tier,
      `"${t.pros.join(', ')}"`,
      `"${t.cons.join(', ')}"`,
      `"${t.critique}"`,
      `"${t.prediction}"`,
      `"${t.counterPlay}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teams_scouting.csv';
    link.click();
  };

  const totalTeams = mockTeams.length;
  const highestScore = Math.max(...mockTeams.map((t) => t.score));
  const averageScore = (mockTeams.reduce((acc, t) => acc + t.score, 0) / mockTeams.length).toFixed(1);

  // Global Keyboard Shortcuts
  useGlobalShortcuts({
    searchInputRef,
    isShortcutsOpen,
    setIsShortcutsOpen,
    selectedTeamNumber: selectedTeam ? selectedTeam.number : null,
    onCloseTeamModal: () => setSelectedTeam(null),
    isCompareMode,
    setIsCompareMode,
    isSimulatorMode,
    setIsSimulatorMode,
    searchQuery,
    setSearchQuery,
    toggleTheme,
    exportToCSV,
    onToggleViewMode: () => setViewMode((prev) => (prev === 'grid' ? 'table' : 'grid')),
    onSelectSort: (sort) => setSortBy(sort),
    onToggleFilterTag: (tag) => setFilterTag((prev) => (prev === tag ? 'All' : tag)),
    onResetFilters: () => {
      setFilterTag('All');
      setSearchQuery('');
      setSortBy('score-desc');
    },
  });

  return (
    <div className="min-h-screen bg-bg-dark text-text-main font-inter pb-20 transition-colors duration-300">
      {/* Navigation Header */}
      <nav className="flex flex-col lg:flex-row justify-between items-center py-3.5 border-b border-border-main mb-6 px-6 bg-bg-dark/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 shadow-sm">
        <div
          onClick={() => {
            setIsCompareMode(false);
            setIsSimulatorMode(false);
            setSearchQuery('');
            setFilterTag('All');
            setSortBy('score-desc');
          }}
          className="flex items-center space-x-4 w-full lg:w-auto cursor-pointer group"
        >
          <div className="bg-integra-yellow text-[#111111] border-2 border-[#111111] px-2.5 py-0.5 text-2xl font-montserrat font-black uppercase rounded-xs group-hover:scale-105 transition-transform duration-200">
            #3646
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted tracking-widest uppercase font-bold">
              Pre-PR Scouting & Analytics
            </span>
            <span className="text-base sm:text-lg font-black font-montserrat tracking-tight text-text-main">
              INTEGRA SCOUTING
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-3 lg:mt-0 w-full lg:w-auto justify-end">
          {/* View Mode Toggle Button */}
          <div className="inline-flex rounded-lg bg-surface p-0.5 border border-border-main text-xs font-bold uppercase">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-integra-yellow text-[#111111] font-black'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Card Grid View (Shortcut: V)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-integra-yellow text-[#111111] font-black'
                  : 'text-text-muted hover:text-text-main'
              }`}
              title="Table Analytics View (Shortcut: V)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Match Simulator Launcher */}
          <button
            id="nav-btn-simulator"
            onClick={() => {
              setIsSimulatorMode(!isSimulatorMode);
              setIsCompareMode(false);
            }}
            aria-keyshortcuts="M"
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center justify-center font-bold text-xs gap-1.5 uppercase ${
              isSimulatorMode
                ? 'bg-integra-yellow text-[#111111] border-integra-yellow shadow-xs'
                : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border-border-main'
            }`}
            title="FRC Match Simulator (Shortcut: M)"
          >
            <Swords className="w-3.5 h-3.5 text-integra-yellow" />
            <span>Simulator</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-bg-dark border border-border-main text-text-muted">
              M
            </kbd>
          </button>

          {/* Compare Launcher */}
          <button
            id="nav-btn-compare"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              setIsSimulatorMode(false);
            }}
            aria-keyshortcuts="C"
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center justify-center font-bold text-xs gap-1.5 uppercase ${
              isCompareMode
                ? 'bg-integra-yellow text-[#111111] border-integra-yellow'
                : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border-border-main'
            }`}
            title="Compare Mode (Shortcut: C)"
          >
            <span>Compare {compareTeams.length > 0 && `(${compareTeams.length})`}</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-bg-dark border border-border-main text-text-muted">
              C
            </kbd>
          </button>

          {/* Export CSV */}
          <button
            id="nav-btn-export-csv"
            onClick={exportToCSV}
            aria-keyshortcuts="E"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1"
            title="Export CSV (Shortcut: E)"
          >
            <Download className="w-4 h-4 text-text-muted hover:text-text-main" />
            <kbd className="hidden xl:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-bg-dark border border-border-main text-text-muted">
              E
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            id="nav-btn-theme-toggle"
            onClick={toggleTheme}
            aria-keyshortcuts="T"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted transition-colors flex items-center justify-center gap-1"
            title={`Toggle Theme (Shortcut: T) - Currently ${isDark ? 'Dark' : 'Light'}`}
          >
            {isDark ? <Sun className="w-4 h-4 text-integra-yellow" /> : <Moon className="w-4 h-4 text-gray-700" />}
            <kbd className="hidden xl:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-bg-dark border border-border-main text-text-muted">
              T
            </kbd>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            id="nav-btn-shortcuts-help"
            onClick={() => setIsShortcutsOpen(true)}
            aria-keyshortcuts="?"
            className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1"
            title="Keyboard Shortcuts (Shortcut: ?)"
          >
            <Keyboard className="w-4 h-4 text-integra-yellow" />
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-bg-dark border border-border-main text-text-muted font-bold">
              ?
            </kbd>
          </button>

          {/* Team Search Input */}
          <div className="bg-surface p-2 rounded-lg border border-border-main flex items-center space-x-2 w-full lg:w-60 relative transition-colors duration-200">
            <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
            <input
              id="main-search-input"
              ref={searchInputRef}
              type="text"
              aria-keyshortcuts="/"
              placeholder="Search team # or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (isSimulatorMode) setIsSimulatorMode(false);
                if (isCompareMode) setIsCompareMode(false);
              }}
              className="bg-transparent outline-none text-xs w-full pl-6 pr-10 placeholder-text-muted text-text-main"
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
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2">
        {isSimulatorMode ? (
          <MatchSimulator
            onClose={() => setIsSimulatorMode(false)}
            initialTeamA={simInitialTeamA}
            initialTeamB={simInitialTeamB}
          />
        ) : isCompareMode ? (
          <TeamCompare
            teams={compareTeams}
            onAddTeam={(t) => setCompareTeams([...compareTeams, t])}
            onRemoveTeam={(t) => setCompareTeams(compareTeams.filter((ct) => ct.number !== t.number))}
            onClose={() => setIsCompareMode(false)}
            onOpenSimulator={(teamA, teamB) => {
              handleOpenSimulator(teamA, teamB);
            }}
          />
        ) : (
          <>
            {/* KPI Stats Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              <div className="bg-surface p-4 rounded-xl border border-border-main relative overflow-hidden transition-colors duration-200">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Total Teams Scouted</div>
                <div className="text-2xl sm:text-3xl font-montserrat font-black mt-1 text-text-main">{totalTeams}</div>
                <div className="absolute -right-2 -bottom-2 opacity-5 text-4xl">
                  <Hexagon size={64} />
                </div>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border-main border-l-4 border-l-integra-yellow transition-colors duration-200">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Host Team</div>
                <div className="text-2xl sm:text-3xl font-montserrat font-black mt-1 text-text-main">#3646 IntegrA</div>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border-main transition-colors duration-200">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Peak Pre-PR Score</div>
                <div className="text-2xl sm:text-3xl font-montserrat font-black mt-1 text-integra-yellow">{highestScore}</div>
              </div>

              <div className="bg-surface p-4 rounded-xl border border-border-main transition-colors duration-200">
                <div className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Average Field Score</div>
                <div className="text-2xl sm:text-3xl font-montserrat font-black mt-1 text-text-main">{averageScore}</div>
              </div>
            </div>

            {/* Quick Sort & Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-1 mb-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  id="filter-btn-score-high"
                  onClick={() => setSortBy('score-desc')}
                  aria-keyshortcuts="1"
                  title="Sort: Highest Score (Shortcut: 1)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    sortBy === 'score-desc'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <span>Score: High</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    sortBy === 'score-desc' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    1
                  </kbd>
                </button>

                <button
                  id="filter-btn-score-low"
                  onClick={() => setSortBy('score-asc')}
                  aria-keyshortcuts="2"
                  title="Sort: Lowest Score (Shortcut: 2)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    sortBy === 'score-asc'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <span>Score: Low</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    sortBy === 'score-asc' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    2
                  </kbd>
                </button>

                <button
                  id="filter-btn-impact-winners"
                  onClick={() => setFilterTag(filterTag === 'Impact Winner' ? 'All' : 'Impact Winner')}
                  aria-keyshortcuts="3"
                  title="Filter: Impact Winners (Shortcut: 3)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    filterTag === 'Impact Winner'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <Trophy className="w-3 h-3 text-integra-yellow" />
                  <span>Impact Winners</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    filterTag === 'Impact Winner' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    3
                  </kbd>
                </button>

                <button
                  id="filter-btn-high-threat"
                  onClick={() => setFilterTag(filterTag === 'High Threat' ? 'All' : 'High Threat')}
                  aria-keyshortcuts="4"
                  title="Filter: High Threat Teams (Shortcut: 4)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    filterTag === 'High Threat'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>High Threat</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    filterTag === 'High Threat' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    4
                  </kbd>
                </button>

                <button
                  id="filter-btn-most-creative"
                  onClick={() => setFilterTag(filterTag === 'Most Creative' ? 'All' : 'Most Creative')}
                  aria-keyshortcuts="5"
                  title="Filter: Most Creative Teams (Shortcut: 5)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    filterTag === 'Most Creative'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>Most Creative</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    filterTag === 'Most Creative' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    5
                  </kbd>
                </button>

                <button
                  id="filter-btn-best-branding"
                  onClick={() => setFilterTag(filterTag === 'Best Branding' ? 'All' : 'Best Branding')}
                  aria-keyshortcuts="6"
                  title="Filter: Best Branding Teams (Shortcut: 6)"
                  className={`px-3 py-1 rounded-full border text-xs transition-colors font-semibold flex items-center gap-1.5 ${
                    filterTag === 'Best Branding'
                      ? 'bg-integra-yellow text-[#111111] border-integra-yellow font-bold'
                      : 'border-border-main text-text-muted hover:text-text-main bg-surface'
                  }`}
                >
                  <Palette className="w-3 h-3 text-sky-400" />
                  <span>Best Branding</span>
                  <kbd className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    filterTag === 'Best Branding' ? 'bg-black/20 text-[#111111]' : 'bg-bg-dark border border-border-main'
                  }`}>
                    6
                  </kbd>
                </button>

                {(filterTag !== 'All' || searchQuery) && (
                  <button
                    id="filter-btn-clear"
                    onClick={() => {
                      setFilterTag('All');
                      setSearchQuery('');
                    }}
                    aria-keyshortcuts="0"
                    title="Reset All Filters (Shortcut: 0)"
                    className="text-xs text-text-muted hover:text-text-main underline ml-2 flex items-center gap-1"
                  >
                    <span>Clear Filters</span>
                    <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface border border-border-main">
                      0
                    </kbd>
                  </button>
                )}
              </div>

              <div className="text-xs text-text-muted font-mono">
                Showing <span className="font-bold text-text-main">{filteredAndSortedTeams.length}</span> teams
              </div>
            </div>

            {/* Main Teams Presentation: Grid View vs Table View */}
            {filteredAndSortedTeams.length > 0 ? (
              viewMode === 'grid' ? (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                        topScore={highestScore}
                        isSelectedForCompare={compareTeams.some((t) => t.number === team.number)}
                        onToggleCompare={handleToggleCompare}
                        compareIndex={compareTeams.findIndex((t) => t.number === team.number)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <TeamTableView
                  teams={filteredAndSortedTeams}
                  selectedCompareTeams={compareTeams}
                  onToggleCompare={handleToggleCompare}
                  onSelectTeam={(t) => setSelectedTeam(t)}
                  onOpenSimulator={(t) => handleOpenSimulator(t)}
                />
              )
            ) : (
              <div className="text-center py-20 bg-surface rounded-xl border border-border-main transition-colors duration-200">
                <Hexagon className="w-12 h-12 text-border-main mx-auto mb-4" />
                <h3 className="text-lg font-montserrat font-bold text-text-muted">No teams found</h3>
                <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search query.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          isSelectedForCompare={compareTeams.some((t) => t.number === selectedTeam.number)}
          onToggleCompare={handleToggleCompare}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {/* Floating Quick Compare Bar appears when at least 2 teams are selected */}
      {!isCompareMode && (
        <QuickCompareBar
          selectedTeams={compareTeams}
          onRemoveTeam={handleToggleCompare}
          onClearAll={handleClearCompare}
          onOpenCompare={handleOpenCompare}
          onOpenSimulator={(teamA, teamB) => {
            handleOpenSimulator(teamA, teamB);
          }}
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
        <Keyboard className="w-4 h-4 text-integra-yellow group-hover:scale-110 transition-transform" />
        <span className="font-medium">Shortcuts</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-bg-dark border border-border-main text-text-muted group-hover:text-integra-yellow">
          ?
        </kbd>
      </button>

      {/* Global Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
