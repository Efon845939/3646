#!/usr/bin/env node
// Builds src/generated/tba-<year>.json from The Blue Alliance's public web pages:
//   - team pages:    nickname, location, rookie year, season record, per-event rank/record/awards
//   - history pages: every award the team has won, all years
//   - event pages:   qualification match scores, used to compute each team's OPR
//
// Usage:  node scripts/fetch-tba.mjs [year]                 refresh every team in src/data.ts
//         node scripts/fetch-tba.mjs [year] 3646 1678       refresh only these teams, merged in
// (behind an HTTPS proxy on Node >= 22.21, run with NODE_USE_ENV_PROXY=1)
// After fetching, run `node scripts/build-team-metrics.mjs` to refresh the app's data file.
//
// Requests are sequential with a pause between them to stay polite to TBA.
// For live data during events, switch to the official TBA API with a free read key.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const YEAR = Number(process.argv[2]) || 2026;
const BASE = 'https://www.thebluealliance.com';
const DELAY_MS = 400;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'src', 'generated', `tba-${YEAR}.json`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': 'IntegraScouting/1.0 (FRC 3646 scouting dashboard)' } });
  if (res.ok) return res.text();
  if (res.status === 404) return null;
  if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
    await sleep(2000 * attempt);
    return fetchPage(url, attempt + 1);
  }
  throw new Error(`${res.status} for ${url}`);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}
const stripTags = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function parseTeamPage(html) {
  const nickname = html.match(/<h2 id="team-title">[\s\S]*?Team \d+ - ([^<]+)<\/h2>/)?.[1].trim() ?? null;
  const location = html.match(/id="team-location"[^>]*>([^<]+)</)?.[1].trim() ?? null;
  const rookieYear = Number(html.match(/Rookie Year: (\d{4})/)?.[1]) || null;

  const season = html.match(/was <strong>(\d+)-(\d+)-(\d+)<\/strong> in official play/);
  const pool = html.match(/In the <a[^>]*>([^<]+)<\/a>, Team \d+ ranked <b>#(\d+)<\/b> having earned <b>(\d+)<\/b> points/);

  // Each event the team attended is a <div class="row" id="<year><code>"> block.
  const events = [];
  const blockRe = new RegExp(`<div class="row" id="(${YEAR}[a-z0-9]+)">`, 'g');
  const starts = [...html.matchAll(blockRe)];
  starts.forEach((m, i) => {
    const block = html.slice(m.index, starts[i + 1]?.index ?? html.length);
    const rank = block.match(/was <strong>Rank (\d+)/);
    const record = block.match(/with a record of\s*<strong>(\d+)-(\d+)-(\d+)<\/strong>/);
    const awardsList = block.match(/won the following awards:\s*<ul>([\s\S]*?)<\/ul>/)?.[1] ?? '';
    const playoff = block.match(/They competed in the playoffs([\s\S]*?)<\/p>/)?.[1];
    events.push({
      key: m[1],
      name: stripTags(block.match(/<h3><a href="\/event\/[^"]+">([\s\S]*?)<\/a><\/h3>/)?.[1] ?? m[1]),
      rank: rank ? Number(rank[1]) : null,
      wins: record ? Number(record[1]) : 0,
      losses: record ? Number(record[2]) : 0,
      ties: record ? Number(record[3]) : 0,
      awards: [...awardsList.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((a) => stripTags(a[1])).filter(Boolean),
      playoff: playoff ? stripTags(playoff).replace(/\s*\.$/, '').trim() : null,
    });
  });

  return {
    nickname,
    location,
    rookieYear,
    record: season ? { wins: Number(season[1]), losses: Number(season[2]), ties: Number(season[3]) } : null,
    pool: pool ? { name: decode(pool[1]), rank: Number(pool[2]), points: Number(pool[3]) } : null,
    events,
  };
}

function parseHistoryPage(html) {
  const rowRe = /<td><a href="\/team\/\d+\/(\d{4})">\d{4}<\/a><\/td>\s*<td><a href="\/event\/([^"]+)">([^<]+)<\/a><\/td>\s*<td>([\s\S]*?)<\/td>/g;
  const awards = [];
  for (const m of html.matchAll(rowRe)) {
    for (const name of m[4].split(/<br\s*\/?>/)) {
      const clean = stripTags(name);
      if (clean) awards.push({ year: Number(m[1]), eventKey: m[2], event: decode(m[3]).trim(), name: clean });
    }
  }
  return awards;
}

// Qualification matches only: playoff alliances are not independent samples for OPR.
function parseQualMatches(html, eventKey) {
  const matches = new Map();
  const rowRe = /<tr class="visible-lg">([\s\S]*?)<\/tr>/g;
  for (const row of html.matchAll(rowRe)) {
    const key = row[1].match(new RegExp(`/match/(${eventKey}_qm\\d+)`))?.[1];
    if (!key || matches.has(key)) continue;
    const teamsOf = (color) =>
      [...row[1].matchAll(new RegExp(`<td colspan="2" class="${color}[^"]*">[\\s\\S]*?<a href="/team/(\\d+)/`, 'g'))].map((t) =>
        Number(t[1])
      );
    const scoreOf = (cls) => {
      const cell = row[1].match(new RegExp(`<td class="${cls}">([\\s\\S]*?)</td>`))?.[1];
      if (!cell) return null;
      const n = stripTags(cell.replace(/<svg[\s\S]*?<\/svg>/g, '')).match(/-?\d+/);
      return n ? Number(n[0]) : null;
    };
    const red = teamsOf('red');
    const blue = teamsOf('blue');
    const redScore = scoreOf('redScore');
    const blueScore = scoreOf('blueScore');
    if (red.length === 3 && blue.length === 3 && redScore !== null && blueScore !== null && redScore >= 0 && blueScore >= 0) {
      matches.set(key, { red, blue, redScore, blueScore });
    }
  }
  return [...matches.values()];
}

// OPR: find per-team contributions x minimising ||A x - b||², where each row of A marks the
// three teams of one alliance and b is that alliance's score. Solved via the normal equations
// (AᵀA) x = Aᵀb with Gaussian elimination; a tiny ridge term keeps the system solvable.
function computeOpr(matches) {
  const teams = [...new Set(matches.flatMap((m) => [...m.red, ...m.blue]))];
  const index = new Map(teams.map((t, i) => [t, i]));
  const n = teams.length;
  const ata = Array.from({ length: n }, () => new Float64Array(n));
  const atb = new Float64Array(n);
  for (const m of matches) {
    for (const [alliance, score] of [[m.red, m.redScore], [m.blue, m.blueScore]]) {
      const idx = alliance.map((t) => index.get(t));
      for (const i of idx) {
        atb[i] += score;
        for (const j of idx) ata[i][j] += 1;
      }
    }
  }
  for (let i = 0; i < n; i++) ata[i][i] += 1e-6;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(ata[r][col]) > Math.abs(ata[pivot][col])) pivot = r;
    [ata[col], ata[pivot]] = [ata[pivot], ata[col]];
    [atb[col], atb[pivot]] = [atb[pivot], atb[col]];
    for (let r = col + 1; r < n; r++) {
      const f = ata[r][col] / ata[col][col];
      if (!f) continue;
      for (let c = col; c < n; c++) ata[r][c] -= f * ata[col][c];
      atb[r] -= f * atb[col];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let sum = atb[r];
    for (let c = r + 1; c < n; c++) sum -= ata[r][c] * x[c];
    x[r] = sum / ata[r][r];
  }
  return new Map(teams.map((t, i) => [t, Math.round(x[i] * 10) / 10]));
}

async function main() {
  const dataTs = await fs.readFile(path.join(ROOT, 'src', 'data.ts'), 'utf8');
  const listed = [...new Set([...dataTs.matchAll(/"number": (\d+)/g)].map((m) => Number(m[1])))];
  const requested = process.argv.slice(3).map(Number).filter(Boolean);
  const teamNumbers = requested.length ? requested : listed;
  console.log(`Fetching ${teamNumbers.length} teams for ${YEAR}…`);

  // A partial refresh starts from the existing snapshot; teams no longer listed are dropped.
  let teams = {};
  if (requested.length) {
    try {
      teams = JSON.parse(await fs.readFile(OUT_FILE, 'utf8')).teams;
    } catch {
      teams = {};
    }
  }
  teams = Object.fromEntries(Object.entries(teams).filter(([n]) => listed.includes(Number(n))));

  for (const [i, number] of teamNumbers.entries()) {
    const teamHtml = await fetchPage(`${BASE}/team/${number}/${YEAR}`);
    await sleep(DELAY_MS);
    const historyHtml = await fetchPage(`${BASE}/team/${number}/history`);
    await sleep(DELAY_MS);
    teams[number] = {
      number,
      ...(teamHtml ? parseTeamPage(teamHtml) : { nickname: null, location: null, rookieYear: null, record: null, pool: null, events: [] }),
      awards: historyHtml ? parseHistoryPage(historyHtml) : [],
    };
    console.log(`[${i + 1}/${teamNumbers.length}] ${number}: ${teams[number].events.length} events, ${teams[number].awards.length} awards`);
  }

  const eventKeys = [
    ...new Set(teamNumbers.flatMap((n) => teams[n].events.map((e) => e.key))),
  ].sort();
  console.log(`Fetching ${eventKeys.length} events for OPR…`);
  const eventOpr = {};
  for (const [i, key] of eventKeys.entries()) {
    const html = await fetchPage(`${BASE}/event/${key}`);
    await sleep(DELAY_MS);
    const matches = html ? parseQualMatches(html, key) : [];
    const opr = matches.length >= 10 ? computeOpr(matches) : new Map();
    eventOpr[key] = { qualMatches: matches.length, opr };
    console.log(`[${i + 1}/${eventKeys.length}] ${key}: ${matches.length} qual matches`);
  }

  for (const number of teamNumbers) {
    const team = teams[number];
    for (const event of team.events) {
      event.qualMatches = eventOpr[event.key]?.qualMatches ?? 0;
      event.opr = eventOpr[event.key]?.opr.get(team.number) ?? null;
    }
  }

  const output = {
    source: 'The Blue Alliance public team, history and event pages (thebluealliance.com)',
    year: YEAR,
    fetchedAt: new Date().toISOString(),
    teams,
  };
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
}

export { parseTeamPage, parseHistoryPage, parseQualMatches, computeOpr };

// Only hit the network when run directly, so the parsers can be imported and tested.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
