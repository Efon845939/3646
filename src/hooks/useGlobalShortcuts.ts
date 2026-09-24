import { useEffect, useLayoutEffect, useRef, RefObject } from 'react';
import { QUICK_FILTERS, QuickFilterId } from '../utils/quickFilters';

// A single view value makes "compare and simulator open at once" unrepresentable.
export type AppView = 'dashboard' | 'compare' | 'simulator' | 'picklist';

interface UseGlobalShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isTeamModalOpen: boolean;
  onCloseTeamModal: () => void;
  activeView: AppView;
  onToggleView: (view: Exclude<AppView, 'dashboard'>) => void;
  onCloseView: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  exportToCSV: () => void;
  onToggleViewMode: () => void;
  onSelectSort: (sort: 'score-desc' | 'score-asc') => void;
  onToggleQuickFilter: (id: QuickFilterId) => void;
  onResetFilters: () => void;
}

export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  return target.isContentEditable;
}

const VIEW_KEYS: Record<string, Exclude<AppView, 'dashboard'>> = {
  c: 'compare',
  m: 'simulator',
  p: 'picklist',
};

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions) {
  // The listener is attached once and always reads the latest options through this ref,
  // instead of being torn down and re-attached on every render.
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore meta/ctrl/alt key combinations (e.g. Cmd+C, Cmd+R, Ctrl+Shift+I)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const o = optionsRef.current;
      const isInput = isTypingInInput(e.target);
      const key = e.key.toLowerCase();

      // ESCAPE closes exactly one layer, innermost first.
      if (e.key === 'Escape') {
        if (o.isShortcutsOpen) {
          e.preventDefault();
          o.setIsShortcutsOpen(false);
        } else if (o.isTeamModalOpen) {
          e.preventDefault();
          o.onCloseTeamModal();
        } else if (o.activeView !== 'dashboard') {
          e.preventDefault();
          o.onCloseView();
        } else if (o.searchQuery.trim() !== '') {
          e.preventDefault();
          o.setSearchQuery('');
        } else if (isInput && o.searchInputRef.current) {
          o.searchInputRef.current.blur();
        }
        return;
      }

      if (isInput) return;

      if (e.key === '?' || key === 'h') {
        e.preventDefault();
        o.setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // While a modal is on screen, keys must not change the page hidden behind it.
      if (o.isShortcutsOpen || o.isTeamModalOpen) return;

      if (e.key === '/') {
        e.preventDefault();
        o.searchInputRef.current?.focus();
        o.searchInputRef.current?.select();
        return;
      }

      const view = VIEW_KEYS[key];
      if (view) {
        e.preventDefault();
        o.onToggleView(view);
        return;
      }

      const quickFilter = QUICK_FILTERS.find((f) => f.shortcut === e.key);
      if (quickFilter) {
        e.preventDefault();
        o.onToggleQuickFilter(quickFilter.id);
        return;
      }

      const actions: Record<string, () => void> = {
        v: o.onToggleViewMode,
        t: o.toggleTheme,
        e: o.exportToCSV,
        '1': () => o.onSelectSort('score-desc'),
        '2': () => o.onSelectSort('score-asc'),
        '0': o.onResetFilters,
      };
      const action = actions[key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
