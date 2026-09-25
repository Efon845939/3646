import { Team, STAT_META } from '../data';
import { readScoutNotes } from './storage';
import { getRealMetrics, winRateOf } from './realMetrics';

export type CsvCell = string | number | boolean | null | undefined;

// RFC 4180: quote a field when it contains a delimiter, quote or line break, and double
// any embedded quotes. Numbers pass through untouched so spreadsheets keep them numeric.
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  // The BOM tells Excel the file is UTF-8, so Turkish characters (ş, ğ, İ) render correctly.
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function datedFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}

// Only real (TBA) numbers and the team's own scouting text are exported; modelled pit specs
// and simulator ratings stay out of spreadsheets.
export function buildTeamsCsv(teams: Team[]): CsvCell[][] {
  const header = [
    'Rank', 'Team', 'Name', 'Location', 'Tier', 'Pre-PR Score',
    'Wins', 'Losses', 'Ties', 'Win %', 'Best OPR', 'Best Event Rank', '2026 Awards', '2026 Event Wins',
    'Impact Wins (all years)', 'Rookie Year', 'Events 2026',
    ...Object.values(STAT_META).map((m) => `${m.label} pct`),
    'Tags', 'Pros', 'Cons', 'Critique', 'Prediction', 'Counter Play', 'Scout Notes',
  ];

  const rows = teams.map((t) => {
    const real = getRealMetrics(t.number);
    return [
      t.rank, t.number, t.name, t.location, t.tier, t.score,
      real?.record?.[0], real?.record?.[1], real?.record?.[2], winRateOf(real?.record ?? null),
      real?.bestOpr, real?.bestEventRank, real?.awards2026, real?.eventWins2026,
      real?.impactWins, real?.rookieYear, real?.events.map((e) => `${e.name} (#${e.rank ?? '-'})`).join('; '),
      ...(Object.keys(STAT_META) as Array<keyof typeof STAT_META>).map((k) => t.stats[k]),
      t.tags.join('; '), t.pros.join('; '), t.cons.join('; '), t.critique, t.prediction, t.counterPlay, readScoutNotes(t.number),
    ];
  });

  return [header, ...rows];
}
