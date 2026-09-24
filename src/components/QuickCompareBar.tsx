import React from 'react';
import { Scale, X, ArrowRight, Trash2, CheckCircle2, Swords } from 'lucide-react';
import { Team } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface QuickCompareBarProps {
  selectedTeams: Team[];
  onRemoveTeam: (team: Team) => void;
  onClearAll: () => void;
  onOpenCompare: () => void;
  onOpenSimulator?: (teamA: Team, teamB: Team) => void;
}

export function QuickCompareBar({
  selectedTeams,
  onRemoveTeam,
  onClearAll,
  onOpenCompare,
  onOpenSimulator,
}: QuickCompareBarProps) {
  // Only display when at least 2 teams are selected
  if (selectedTeams.length < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="quick-compare-bar"
        initial={{ y: 90, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 90, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl"
      >
        <div className="bg-[#18181b]/95 backdrop-blur-md border-2 border-integra-yellow/80 rounded-2xl p-3 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(254,222,0,0.25)] flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          {/* Left Side: Badge & Selected Team Chips */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <div className="p-2.5 rounded-xl bg-integra-yellow text-[#111111] shrink-0 shadow-md">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-montserrat uppercase tracking-wider text-integra-yellow">
                  Quick Compare
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/10 rounded-full text-zinc-300 font-mono">
                  {selectedTeams.length}/4 Teams
                </span>
              </div>

              {/* Scrollable Team Chips */}
              <div className="flex items-center gap-1.5 mt-1 overflow-x-auto py-0.5 max-w-full scrollbar-none">
                {selectedTeams.map((team) => (
                  <div
                    key={team.number}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800/90 border border-zinc-700 text-xs font-bold shrink-0 hover:border-zinc-500 transition-colors"
                  >
                    <span className="text-integra-yellow font-black font-montserrat">
                      #{team.number}
                    </span>
                    <span className="text-[11px] text-zinc-300 truncate max-w-[80px]">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({team.score})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTeam(team);
                      }}
                      className="ml-0.5 p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                      title={`Remove #${team.number} from comparison`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Actions (Clear All & Launch Comparison) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
            <button
              onClick={onClearAll}
              className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors flex items-center gap-1 uppercase tracking-wider"
              title="Clear all selected teams"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Clear</span>
            </button>

            {onOpenSimulator && selectedTeams.length >= 2 && (
              <button
                onClick={() => onOpenSimulator(selectedTeams[0], selectedTeams[1])}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-integra-yellow/20 hover:from-amber-500/30 hover:to-integra-yellow/30 border border-integra-yellow/40 hover:border-integra-yellow text-integra-yellow text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Seçili takımları Match Simulator'da çalıştır"
              >
                <Swords className="w-3.5 h-3.5 text-integra-yellow" />
                <span className="hidden sm:inline">Match Simulator</span>
                <span className="sm:hidden">Simüle Et</span>
              </button>
            )}

            <button
              id="btn-quick-compare-now"
              onClick={onOpenCompare}
              aria-keyshortcuts="C"
              title="Compare Now (C)"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-integra-yellow hover:bg-yellow-400 text-[#111111] font-montserrat font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Compare Now ({selectedTeams.length})</span>
              <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/20 text-[#111111] border border-black/15 shadow-2xs">
                C
              </kbd>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
