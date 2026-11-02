import peatixSnapshot from '../../scripts/peatix-past-snapshot.json';
import { dateFromPeatixHost, dateFromRow } from '../../scripts/peatix-past-group.mjs';
import {
  normalizePerformanceHistoryEntry,
  performanceHistoryDayKey,
  type PerformanceHistoryItem,
} from './performance-history';

export { dateFromPeatixHost };

type SnapshotRow = { href: string; text: string };

const snapshot = peatixSnapshot as SnapshotRow[];

function normalizePeatixEventUrl(href: string): string {
  const url = new URL(href.split('?')[0]);
  url.pathname = '';
  return url.href.replace(/\/$/, '');
}

function normalizePeatixListingTitle(text: string): string {
  return text
    .replace(/\d{1,2}月\d{1,2}日.*$/u, '')
    .replace(/\s+(20\d{2}\/)?\d{1,2}\/\d{1,2}.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForMatch(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/斎/g, '齋')
    .trim()
    .toLowerCase();
}

function workTitle(title: string): string | null {
  const m = title.match(/『([^』]+)』/u);
  return m ? normalizeForMatch(m[1]) : null;
}

function scoreTitleMatch(eventTitle: string, peatixTitle: string): number {
  const a = normalizeForMatch(eventTitle);
  const b = normalizeForMatch(peatixTitle);
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  const workA = workTitle(eventTitle);
  const workB = workTitle(peatixTitle);
  if (workA && workB && workA === workB) return 90;
  if (workA && b.includes(workA)) return 80;
  if (workB && a.includes(workB)) return 80;
  return 0;
}

let snapshotByTitle: Map<string, Map<string, string>> | null = null;

function getSnapshotByTitle(): Map<string, Map<string, string>> {
  if (snapshotByTitle) return snapshotByTitle;

  snapshotByTitle = new Map();
  for (const row of snapshot) {
    const title = normalizePeatixListingTitle(row.text);
    const day = dateFromRow(row.href, row.text);
    if (!title || !day) continue;

    let dates = snapshotByTitle.get(title);
    if (!dates) {
      dates = new Map();
      snapshotByTitle.set(title, dates);
    }
    dates.set(day, normalizePeatixEventUrl(row.href));
  }
  return snapshotByTitle;
}

function snapshotLinksForEventTitle(eventTitle: string): Map<string, string> {
  const index = getSnapshotByTitle();
  let best: Map<string, string> | null = null;
  let bestScore = 0;

  for (const [peatixTitle, dates] of index) {
    const score = scoreTitleMatch(eventTitle, peatixTitle);
    if (score > bestScore) {
      bestScore = score;
      best = dates;
    }
  }

  return bestScore >= 80 && best ? new Map(best) : new Map();
}

export function peatixUrlsFromMarkdown(body: string): Map<string, string> {
  const map = new Map<string, string>();

  const mdLink = /\[([^\]]+)\]\((https?:\/\/[^)]+\.peatix\.com[^)]*)\)/gi;
  for (const m of body.matchAll(mdLink)) {
    const label = m[1];
    const href = m[2].split('?')[0];
    const day = dateFromPeatixHost(href);
    if (!day) continue;
    const url = normalizePeatixEventUrl(href);
    map.set(day, url);
    const time = label.match(/(\d{1,2}:\d{2})/)?.[1];
    if (time) map.set(`${day}#${time}`, url);
  }

  const re = /https?:\/\/([a-z0-9-]+)\.peatix\.com(\/view)?/gi;
  for (const m of body.matchAll(re)) {
    const href = m[0].split('?')[0];
    const day = dateFromPeatixHost(href);
    if (day && !map.has(day)) map.set(day, normalizePeatixEventUrl(href));
  }
  return map;
}

export function peatixUrlsFromTickets(
  tickets?: { url: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of tickets ?? []) {
    if (!t.url.includes('peatix.com')) continue;
    const day = dateFromPeatixHost(t.url);
    if (day) map.set(day, normalizePeatixEventUrl(t.url));
  }
  return map;
}

/** 公演タイトル・本文・チケットから日付→Peatix URL を解決 */
export function buildPeatixLinkResolver(input: {
  title: string;
  body?: string;
  tickets?: { url: string }[];
}): (item: PerformanceHistoryItem) => string | undefined {
  const merged = new Map<string, string>();

  for (const [k, v] of snapshotLinksForEventTitle(input.title)) merged.set(k, v);
  for (const [k, v] of peatixUrlsFromMarkdown(input.body ?? '')) merged.set(k, v);
  for (const [k, v] of peatixUrlsFromTickets(input.tickets)) merged.set(k, v);

  return (item) => {
    const key = performanceHistoryDayKey(item);
    if (!key) return undefined;
    const normalized = normalizePerformanceHistoryEntry(item);
    if (normalized?.time) {
      const slot = merged.get(`${key}#${normalized.time}`);
      if (slot) return slot;
    }
    return merged.get(key);
  };
}
