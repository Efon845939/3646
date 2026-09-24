import { Award, Palette, ShieldAlert, Trophy, type LucideIcon } from 'lucide-react';
import { Team, mockTeams } from '../data';

export const HOST_TEAM_NUMBER = 3646;

export type QuickFilterId = 'impact' | 'threat' | 'finalist' | 'branding';

export interface QuickFilter {
  id: QuickFilterId;
  label: string;
  shortcut: '3' | '4' | '5' | '6';
  description: string;
  icon: LucideIcon;
  iconClass: string;
  matches: (team: Team) => boolean;
}

const hostEPA = mockTeams.find((t) => t.number === HOST_TEAM_NUMBER)?.frcStats?.epa.total ?? 0;

// Every chip is derived from fields the dataset actually has, so no filter can silently
// return an empty list because a hand-written tag was never assigned to any team.
export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'impact',
    label: 'Impact Winners',
    shortcut: '3',
    description: 'Impact Award winners and FIRST Hall of Fame teams',
    icon: Trophy,
    iconClass: 'text-accent',
    matches: (t) => t.tags.some((tag) => tag === 'Impact Winner' || tag.endsWith('HoF')),
  },
  {
    id: 'threat',
    label: 'High Threat',
    shortcut: '4',
    description: `Rivals whose Total EPA is at or above #${HOST_TEAM_NUMBER} (${hostEPA})`,
    icon: ShieldAlert,
    iconClass: 'text-rose-400',
    matches: (t) => t.number !== HOST_TEAM_NUMBER && (t.frcStats?.epa.total ?? 0) >= hostEPA,
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
    id: 'branding',
    label: 'Best Branding',
    shortcut: '6',
    description: 'Media & Branding (MED) rating of 85 or higher',
    icon: Palette,
    iconClass: 'text-sky-400',
    matches: (t) => t.stats.med >= 85,
  },
];

export function getQuickFilter(id: QuickFilterId): QuickFilter {
  return QUICK_FILTERS.find((f) => f.id === id)!;
}
