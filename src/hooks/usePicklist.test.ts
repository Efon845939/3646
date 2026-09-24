import { describe, expect, it } from 'vitest';
import { sanitizePicklist } from './usePicklist';

describe('sanitizePicklist', () => {
  it('drops unknown teams, the host team, non-numbers and cross-lane duplicates', () => {
    const stored = { first: [1678, 999999, 3646, 1678], second: [1678, 498], dnp: ['118', 118] };
    expect(sanitizePicklist(stored)).toEqual({ first: [1678], second: [498], dnp: [118] });
  });

  it('falls back to empty lanes for malformed data', () => {
    for (const raw of [null, 'oops', 42, { first: 'nope' }]) {
      expect(sanitizePicklist(raw)).toEqual({ first: [], second: [], dnp: [] });
    }
  });
});
