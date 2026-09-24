import { Team, getEnhancedTeamStats } from '../data';
import { readScoutNotes } from './storage';

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

export function buildTeamsCsv(teams: Team[]): CsvCell[][] {
  const header = [
    'Rank', 'Team', 'Name', 'Location', 'Tier', 'Pre-PR Score',
    'OUT', 'SUS', 'TEC', 'PIP', 'MED', 'DAT',
    'EPA Total', 'EPA Auto', 'EPA Teleop', 'EPA Endgame', 'EPA Percentile',
    'OPR', 'DPR', 'CCWM', 'Wins', 'Losses', 'Ties', 'Win %', 'Avg RP',
    'Avg Cycles', 'Cycle Time (s)', 'Accuracy %', 'Climb', 'Climb Success %',
    'Drivetrain', 'Drive Motors', 'Vision', 'Tags',
    'Pros', 'Cons', 'Critique', 'Prediction', 'Counter Play', 'Scout Notes',
  ];

  const rows = teams.map((t) => {
    const s = t.frcStats ?? getEnhancedTeamStats(t);
    return [
      t.rank, t.number, t.name, t.location, t.tier, t.score,
      t.stats.out, t.stats.sus, t.stats.tec, t.stats.pip, t.stats.med, t.stats.dat,
      s.epa.total, s.epa.auto, s.epa.teleop, s.epa.endgame, s.epa.percentile,
      s.opr, s.dpr, s.ccwm, s.record.wins, s.record.losses, s.record.ties, s.record.winRate, s.rpContribution.avgRP,
      s.cycles.avgTeleopCycles, s.cycles.avgCycleTimeSec, s.cycles.scoringAccuracyPct, s.cycles.climbType, s.cycles.climbSuccessPct,
      s.specs.drivetrain, s.specs.driveMotors, s.specs.visionSystem, t.tags.join('; '),
      t.pros.join('; '), t.cons.join('; '), t.critique, t.prediction, t.counterPlay, readScoutNotes(t.number),
    ];
  });

  return [header, ...rows];
}
