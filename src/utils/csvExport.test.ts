import { describe, expect, it } from 'vitest';
import { buildTeamsCsv, toCsv } from './csvExport';
import { mockTeams } from '../data';

describe('toCsv', () => {
  it('leaves plain values unquoted so numbers stay numeric', () => {
    expect(toCsv([['Citrus Circuits', 1678, 58.6]])).toBe('Citrus Circuits,1678,58.6');
  });

  it('quotes delimiters, quotes and line breaks (RFC 4180)', () => {
    expect(toCsv([['a,b', 'say "hi"', 'x\ny']])).toBe('"a,b","say ""hi""","x\ny"');
  });

  it('writes empty cells for missing values', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(',,0');
  });

  it('separates rows with CRLF', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb');
  });
});

describe('buildTeamsCsv', () => {
  it('emits a header plus one row per team, all with the same column count', () => {
    const rows = buildTeamsCsv(mockTeams.slice(0, 5));
    expect(rows).toHaveLength(6);
    for (const row of rows) expect(row).toHaveLength(rows[0].length);
  });
});
