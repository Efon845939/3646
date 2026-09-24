import React, { useEffect, useState } from 'react';
import { X, Keyboard, Search, Scale, Swords, SunMoon, Download, ArrowUpDown, LayoutGrid, ListOrdered } from 'lucide-react';
import { QUICK_FILTERS } from '../utils/quickFilters';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyDisplay: string;
  keyChar: string;
  description: string;
  category: 'workflow' | 'filters' | 'system';
  icon: React.ReactNode;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Escape is owned by useGlobalShortcuts; this listener only highlights the pressed key.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKey(e.key.toLowerCase());
      clearTimeout(timer);
      timer = setTimeout(() => setActiveKey(null), 600);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    {
      keyDisplay: '/',
      keyChar: '/',
      description: 'Focus Team Search input (auto-selects text)',
      category: 'workflow',
      icon: <Search className="w-4 h-4 text-accent" />,
    },
    {
      keyDisplay: 'Esc',
      keyChar: 'escape',
      description: 'Close the top layer: modal, then compare / simulator / picklist, then search',
      category: 'workflow',
      icon: <X className="w-4 h-4 text-rose-400" />,
    },
    {
      keyDisplay: 'V',
      keyChar: 'v',
      description: 'Toggle Grid View / Table Analytics View',
      category: 'workflow',
      icon: <LayoutGrid className="w-4 h-4 text-sky-400" />,
    },
    {
      keyDisplay: 'C',
      keyChar: 'c',
      description: 'Toggle Team Compare mode / return to dashboard',
      category: 'workflow',
      icon: <Scale className="w-4 h-4 text-blue-400" />,
    },
    {
      keyDisplay: 'M',
      keyChar: 'm',
      description: 'Toggle FRC Match Simulator arena',
      category: 'workflow',
      icon: <Swords className="w-4 h-4 text-amber-400" />,
    },
    {
      keyDisplay: 'P',
      keyChar: 'p',
      description: 'Toggle Alliance Picklist (drag & drop pick order)',
      category: 'workflow',
      icon: <ListOrdered className="w-4 h-4 text-accent" />,
    },
    {
      keyDisplay: '1',
      keyChar: '1',
      description: 'Sort by Score: High to Low',
      category: 'filters',
      icon: <ArrowUpDown className="w-4 h-4 text-text-muted" />,
    },
    {
      keyDisplay: '2',
      keyChar: '2',
      description: 'Sort by Score: Low to High',
      category: 'filters',
      icon: <ArrowUpDown className="w-4 h-4 text-text-muted" />,
    },
    ...QUICK_FILTERS.map((filter): ShortcutItem => {
      const Icon = filter.icon;
      return {
        keyDisplay: filter.shortcut,
        keyChar: filter.shortcut,
        description: `Toggle filter: ${filter.label}`,
        category: 'filters',
        icon: <Icon className={`w-4 h-4 ${filter.iconClass}`} />,
      };
    }),
    {
      keyDisplay: '0',
      keyChar: '0',
      description: 'Reset all filters & clear search input',
      category: 'filters',
      icon: <X className="w-4 h-4 text-text-muted" />,
    },
    {
      keyDisplay: 'T',
      keyChar: 't',
      description: 'Toggle Dark / Light color theme',
      category: 'system',
      icon: <SunMoon className="w-4 h-4 text-amber-300" />,
    },
    {
      keyDisplay: 'E',
      keyChar: 'e',
      description: 'Export the filtered team list (with EPA & scout notes) to CSV',
      category: 'system',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
    },
    {
      keyDisplay: '?',
      keyChar: '?',
      description: 'Open / Close this keyboard shortcuts guide',
      category: 'system',
      icon: <Keyboard className="w-4 h-4 text-accent" />,
    },
  ];

  const workflowShortcuts = shortcuts.filter((s) => s.category === 'workflow');
  const filterShortcuts = shortcuts.filter((s) => s.category === 'filters');
  const systemShortcuts = shortcuts.filter((s) => s.category === 'system');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-surface border border-border-main rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border-main bg-bg-dark/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-integra-yellow/20 text-accent border border-integra-yellow/40">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black font-montserrat uppercase text-text-main">
                  Scouting Keyboard Shortcuts
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  High-speed navigation shortcuts for match scouting and pit operations.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border border-border-main transition-colors"
              title="Close shortcuts guide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Workflow Category */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-accent block mb-2.5 font-montserrat">
                Navigation & Views
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workflowShortcuts.map((item) => {
                  const isPressed = activeKey === item.keyChar;
                  return (
                    <div
                      key={item.keyDisplay}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isPressed
                          ? 'bg-integra-yellow/20 border-integra-yellow scale-[1.02]'
                          : 'bg-bg-dark/70 border-border-main/80 hover:border-border-main'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-xs text-text-main font-medium leading-snug truncate">
                          {item.description}
                        </span>
                      </div>
                      <kbd className="shrink-0 px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-border-main text-accent shadow-xs">
                        {item.keyDisplay}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters Category */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-text-muted block mb-2.5 font-montserrat">
                Filters & Quick Sorts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filterShortcuts.map((item) => {
                  const isPressed = activeKey === item.keyChar;
                  return (
                    <div
                      key={item.keyDisplay}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isPressed
                          ? 'bg-integra-yellow/20 border-integra-yellow scale-[1.02]'
                          : 'bg-bg-dark/70 border-border-main/80 hover:border-border-main'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-xs text-text-main font-medium leading-snug truncate">
                          {item.description}
                        </span>
                      </div>
                      <kbd className="shrink-0 px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-border-main text-text-main shadow-xs">
                        {item.keyDisplay}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Category */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-text-muted block mb-2.5 font-montserrat">
                System & Export
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {systemShortcuts.map((item) => {
                  const isPressed = activeKey === item.keyChar;
                  return (
                    <div
                      key={item.keyDisplay}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isPressed
                          ? 'bg-integra-yellow/20 border-integra-yellow scale-[1.02]'
                          : 'bg-bg-dark/70 border-border-main/80 hover:border-border-main'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-xs text-text-main font-medium leading-snug truncate">
                          {item.description}
                        </span>
                      </div>
                      <kbd className="shrink-0 px-2 py-1 text-xs font-mono font-bold rounded-md bg-surface border border-border-main text-text-main shadow-xs">
                        {item.keyDisplay}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-bg-dark border-t border-border-main flex items-center justify-between text-[11px] text-text-muted">
            <span>Shortcuts are disabled while typing in notes or input fields</span>
            <span className="font-mono text-accent font-semibold">Press Esc to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
