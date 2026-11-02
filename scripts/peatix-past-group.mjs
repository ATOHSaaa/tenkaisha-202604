#!/usr/bin/env node
/**
 * Peatix 過去イベント URL 一覧（JSON）を作品単位にまとめる。
 *
 * 入力: scripts/peatix-past-snapshot.json
 *   [{ "href": "https://cappa20261031.peatix.com/view", "text": "..." }, ...]
 *
 * 使い方:
 *   node scripts/peatix-past-group.mjs
 *
 * tenkai.peatix.com/events/past は JS 描画のため、ブラウザでページを開き
 * 「その他のイベント」を押し終えたあと CDP 等で snapshot を更新してから実行する。
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = join(__dirname, 'peatix-past-snapshot.json');

const PAST_REF = new Date('2026-11-01T12:00:00+09:00');

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** 転回社プロデュース「ジョン王」 kingjohn1227 / kingjohn108a 等 */
function dateFromKingJohnHost(host) {
  const m = host.match(/^kingjohn(\d+)([ab])?$/i);
  if (!m) return null;

  const digits = m[1];
  let month;
  let day;
  if (digits.length === 4) {
    month = Number(digits.slice(0, 2));
    day = Number(digits.slice(2));
  } else if (digits.length === 3) {
    month = Number(digits.slice(0, 1));
    day = Number(digits.slice(1));
  } else if (digits.length === 2) {
    month = Number(digits.slice(0, 1));
    day = Number(digits.slice(1));
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = month === 12 ? 2017 : 2018;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** サブドomain 先頭の yyyymmdd / yy mm dd 風を暦日に */
export function dateFromPeatixHost(href) {
  const host = new URL(href).hostname.split('.')[0];
  const m8 = host.match(/(20\d{2})(\d{2})(\d{2})/);
  if (m8) return `${m8[1]}-${m8[2]}-${m8[3]}`;
  const m6 = host.match(/(\d{2})(\d{2})(\d{2})$/);
  if (m6) return `20${m6[1]}-${m6[2]}-${m6[3]}`;
  const kingJohn = dateFromKingJohnHost(host);
  if (kingJohn) return kingJohn;
  return null;
}

function inferYear(month, day) {
  for (const y of [2026, 2025, 2024, 2023, 2022, 2021, 2020]) {
    const d = new Date(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00+09:00`);
    if (d <= PAST_REF) return y;
  }
  return 2020;
}

/** ホスト名・リンク文言から公演日（YYYY-MM-DD） */
export function dateFromRow(href, text) {
  const fromHost = dateFromPeatixHost(href);
  if (fromHost) return fromHost;

  const slash = text.match(/(20\d{2})\/(\d{1,2})\/(\d{1,2})/);
  if (slash) {
    return `${slash[1]}-${pad2(slash[2])}-${pad2(slash[3])}`;
  }

  const host = new URL(href).hostname.split('.')[0];
  const md = text.match(/(\d{1,2})月(\d{1,2})日/u);
  if (!md) return null;

  const month = md[1].padStart(2, '0');
  const dom = md[2].padStart(2, '0');

  const yearStart = host.match(/^(20\d{2})/);
  if (yearStart) {
    return `${yearStart[1]}-${month}-${dom}`;
  }

  const yearInHost = host.match(/(20\d{2})/);
  if (yearInHost) {
    return `${yearInHost[1]}-${month}-${dom}`;
  }

  const mmdd = host.match(/(\d{2})(\d{2})(?:[a-z])?$/i);
  if (mmdd && mmdd[1] === month && mmdd[2] === dom) {
    const y = inferYear(+month, +dom);
    return `${y}-${month}-${dom}`;
  }

  const y = inferYear(+month, +dom);
  return `${y}-${month}-${dom}`;
}

export function normalizeTitle(text) {
  return text
    .replace(/\d{1,2}月\d{1,2}日.*$/u, '')
    .replace(/\s+(20\d{2}\/)?\d{1,2}\/\d{1,2}.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function groupPeatixRows(raw) {
  const groups = new Map();
  let skipped = 0;

  for (const row of raw) {
    const day = dateFromRow(row.href, row.text);
    const title = normalizeTitle(row.text);
    if (!day || !title) {
      skipped += 1;
      continue;
    }
    if (!groups.has(title)) groups.set(title, { title, dates: new Set(), sample: row.href });
    groups.get(title).dates.add(day);
  }

  const sorted = [...groups.values()]
    .map((g) => ({
      title: g.title,
      sample: g.sample,
      performanceHistory: [...g.dates].sort().reverse(),
    }))
    .sort((a, b) => (a.performanceHistory[0] ?? '').localeCompare(b.performanceHistory[0] ?? ''))
    .reverse();

  return { groups: sorted, skipped };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  const { groups, skipped } = groupPeatixRows(raw);
  if (process.env.PEATIX_VERBOSE) {
    console.error(`rows: ${raw.length}, groups: ${groups.length}, skipped: ${skipped}`);
  }
  console.log(JSON.stringify(groups, null, 2));
}
