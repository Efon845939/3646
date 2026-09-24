import { useEffect, RefObject } from 'react';

interface UseGlobalShortcutsOptions {
  searchInputRef: RefObject<HTMLInputElement | null>;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  selectedTeamNumber: number | null;
  onCloseTeamModal: () => void;
  isCompareMode: boolean;
  setIsCompareMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  isSimulatorMode: boolean;
  setIsSimulatorMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  exportToCSV: () => void;
  onToggleViewMode?: () => void;
  onSelectSort?: (sort: 'score-desc' | 'score-asc') => void;
  onToggleFilterTag?: (tag: 'Impact Winner' | 'Most Creative' | 'High Threat' | 'Best Branding') => void;
  onResetFilters?: () => void;
}

export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return false;
}

export function useGlobalShortcuts({
  searchInputRef,
  isShortcutsOpen,
  setIsShortcutsOpen,
  selectedTeamNumber,
  onCloseTeamModal,
  isCompareMode,
  setIsCompareMode,
  isSimulatorMode,
  setIsSimulatorMode,
  searchQuery,
  setSearchQuery,
  toggleTheme,
  exportToCSV,
  onToggleViewMode,
  onSelectSort,
  onToggleFilterTag,
  onResetFilters,
}: UseGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore meta/ctrl/alt key combinations (e.g. Cmd+C, Cmd+R, Ctrl+Shift+I)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const isInput = isTypingInInput(e.target);

      // 1. ESCAPE: Handle hierarchically
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          e.preventDefault();
          setIsShortcutsOpen(false);
          return;
        }

        if (selectedTeamNumber !== null) {
          e.preventDefault();
          onCloseTeamModal();
          return;
        }

        if (isCompareMode) {
          e.preventDefault();
          setIsCompareMode(false);
          return;
        }

        if (isSimulatorMode) {
          e.preventDefault();
          setIsSimulatorMode(false);
          return;
        }

        if (searchQuery.trim() !== '') {
          e.preventDefault();
          setSearchQuery('');
          return;
        }

        if (isInput && searchInputRef.current) {
          searchInputRef.current.blur();
          return;
        }
        return;
      }

      // If user is currently typing in an input, do not trigger single-key action shortcuts
      if (isInput) {
        return;
      }

      // 2. SEARCH FOCUS: '/'
      if (e.key === '/') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // 3. SHORTCUTS HELP: '?' or 'h'
      if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 4. COMPARE MODE: 'c'
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsCompareMode((prev) => !prev);
        setIsSimulatorMode(false);
        return;
      }

      // 5. SIMULATOR: 'm'
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsSimulatorMode((prev) => !prev);
        setIsCompareMode(false);
        return;
      }

      // 6. VIEW MODE TOGGLE: 'v'
      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        onToggleViewMode?.();
        return;
      }

      // 7. THEME TOGGLE: 't'
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // 8. EXPORT CSV: 'e'
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportToCSV();
        return;
      }

      // 9. QUICK SORTS & FILTERS: Number keys 1-6 and 0
      if (e.key === '1') {
        e.preventDefault();
        onSelectSort?.('score-desc');
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        onSelectSort?.('score-asc');
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        onToggleFilterTag?.('Impact Winner');
        return;
      }

      if (e.key === '4') {
        e.preventDefault();
        onToggleFilterTag?.('High Threat');
        return;
      }

      if (e.key === '5') {
        e.preventDefault();
        onToggleFilterTag?.('Most Creative');
        return;
      }

      if (e.key === '6') {
        e.preventDefault();
        onToggleFilterTag?.('Best Branding');
        return;
      }

      if (e.key === '0') {
        e.preventDefault();
        onResetFilters?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    searchInputRef,
    isShortcutsOpen,
    setIsShortcutsOpen,
    selectedTeamNumber,
    onCloseTeamModal,
    isCompareMode,
    setIsCompareMode,
    isSimulatorMode,
    setIsSimulatorMode,
    searchQuery,
    setSearchQuery,
    toggleTheme,
    exportToCSV,
    onToggleViewMode,
    onSelectSort,
    onToggleFilterTag,
    onResetFilters,
  ]);
}
