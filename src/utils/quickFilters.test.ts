import { describe, expect, it } from 'vitest';
import { HOST_TEAM_NUMBER, QUICK_FILTERS, QuickFilter } from './quickFilters';
import { mockTeams } from '../data';

describe('quick filters', () => {
  const table: Array<[string, QuickFilter]> = QUICK_FILTERS.map((f) => [f.label, f]);

  // Three of the original chips filtered on tags no team had, so they always came back empty.
  it.each(table)('"%s" matches at least one team', (_label, filter) => {
    expect(mockTeams.filter(filter.matches).length).toBeGreaterThan(0);
  });

  it('never flags the host team as a threat', () => {
    const threat = QUICK_FILTERS.find((f) => f.id === 'threat')!;
    expect(threat.matches(mockTeams.find((t) => t.number === HOST_TEAM_NUMBER)!)).toBe(false);
  });

  it('uses a distinct shortcut key per filter', () => {
    const keys = QUICK_FILTERS.map((f) => f.shortcut);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
