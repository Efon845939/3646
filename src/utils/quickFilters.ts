import { Award, Medal, ShieldAlert, Trophy, type LucideIcon } from 'lucide-react';
import { Team } from '../data';
import { getRealMetrics } from './realMetrics';

export const HOST_TEAM_NUMBER = 3646;

export type QuickFilterId = 'impact' | 'threat' | 'finalist' | 'winners';

export interface QuickFilter {
  id: QuickFilterId;
  label: string;
  shortcut: '3' | '4' | '5' | '6';
  description: string;
  icon: LucideIcon;
  iconClass: string;
  matches: (team: Team) => boolean;
}

// Every chip is derived from real TBA results (or the source ranking's own tags), so no filter
// can silently return an empty list because a hand-written tag was never assigned.
// Every team in this list won an Impact award in 2026, so "impact" looks at depth of record.
export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'impact',
    label: 'Impact Veterans',
    shortcut: '3',
    description: "8 or more Impact / Chairman's Award wins across all seasons",
    icon: Trophy,
    iconClass: 'text-accent',
    matches: (t) => (getRealMetrics(t.number)?.impactWins ?? 0) >= 8,
  },
  {
    id: 'threat',
    label: 'High Threat',
    shortcut: '4',
    description: 'Top 25% of this list by best 2026 event OPR',
    icon: ShieldAlert,
    iconClass: 'text-rose-400',
    matches: (t) => t.number !== HOST_TEAM_NUMBER && t.stats.opr >= 75,
  },
  {
    id: 'finalist',
    label: 'Champs Finalists',
    shortcut: '5',
    description: 'Teams with an Einstein or season finalist tag on record',
    icon: Award,
    iconClass: 'text-emerald-400',
    matches: (t) => t.tags.some((tag) => tag.includes('Finalist')),
  },
  {
    id: 'winners',
    label: 'Event Winners',
    shortcut: '6',
    description: 'Won at least one 2026 event',
    icon: Medal,
    iconClass: 'text-sky-400',
    matches: (t) => (getRealMetrics(t.number)?.eventWins2026 ?? 0) > 0,
  },
];

export function getQuickFilter(id: QuickFilterId): QuickFilter {
  return QUICK_FILTERS.find((f) => f.id === id)!;
}
