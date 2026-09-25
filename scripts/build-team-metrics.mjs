#!/usr/bin/env node
// Compacts the raw TBA snapshot (src/generated/tba-<year>.json, ~800 kB) into the small file the
// app actually bundles (src/generated/team-metrics-<year>.json). Only fields shown in the UI are
// kept; the full award history stays in the raw snapshot.
//
// Usage: node scripts/build-team-metrics.mjs [year]

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const YEAR = Number(process.argv[2]) || 2026;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_FILE = path.join(ROOT, 'src', 'generated', `tba-${YEAR}.json`);
const OUT_FILE = path.join(ROOT, 'src', 'generated', `team-metrics-${YEAR}.json`);

// Chairman's Award was renamed FIRST Impact Award in 2023; both count as Impact wins.
const IMPACT_WIN = (name) => /(Chairman's Award|FIRST Impact Award)(\s+sponsored.*)?$/.test(name) && !/Finalist/.test(name);
const IMPACT_FINALIST = (name) => /(Chairman's Award|FIRST Impact Award) Finalist/.test(name);
const EVENT_WIN = (name) => /\bWinners?\b/.test(name) && !/Dean's List|Woodie/.test(name);
const PARTICIPATION = (name) => /Participation/.test(name);

const raw = JSON.parse(await fs.readFile(RAW_FILE, 'utf8'));
const teams = {};

for (const t of Object.values(raw.teams)) {
  const events = t.events.map((e) => ({
    key: e.key,
    name: e.name,
    rank: e.rank,
    record: [e.wins, e.losses, e.ties],
    opr: e.opr,
    awards: e.awards.filter((a) => !PARTICIPATION(a)),
    playoff: e.playoff,
  }));
  const oprs = events.map((e) => e.opr).filter((v) => typeof v === 'number');
  const ranks = events.map((e) => e.rank).filter((v) => typeof v === 'number');
  const impactHistory = t.awards
    .filter((a) => IMPACT_WIN(a.name) || IMPACT_FINALIST(a.name))
    .map((a) => ({ year: a.year, event: a.event, name: a.name }));

  teams[t.number] = {
    location: t.location,
    rookieYear: t.rookieYear,
    record: t.record ? [t.record.wins, t.record.losses, t.record.ties] : null,
    pool: t.pool,
    bestOpr: oprs.length ? Math.max(...oprs) : null,
    bestEventRank: ranks.length ? Math.min(...ranks) : null,
    awards2026: events.reduce((n, e) => n + e.awards.length, 0),
    eventWins2026: events.reduce((n, e) => n + e.awards.filter(EVENT_WIN).length, 0),
    impactWins: impactHistory.filter((a) => IMPACT_WIN(a.name)).length,
    impactWin2026: impactHistory.some((a) => a.year === YEAR && IMPACT_WIN(a.name)),
    totalAwards: t.awards.length,
    events,
    impactHistory,
  };
}

await fs.writeFile(
  OUT_FILE,
  JSON.stringify({ source: raw.source, year: raw.year, fetchedAt: raw.fetchedAt, teams }) + '\n'
);
const kb = ((await fs.stat(OUT_FILE)).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(ROOT, OUT_FILE)} (${Object.keys(teams).length} teams, ${kb} kB)`);
