import { getCollection, type CollectionEntry } from 'astro:content';
import { calendarDayKeyInJST } from './schedule';

export interface NewsListItem {
  slug: string;
  title: string;
  date: Date;
  href: string;
}

function dayKeyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 掲載日が今日から withinDays 日以内（JST・暦日）なら true */
export function isRecentNewsDate(
  date: Date,
  withinDays = 7,
  todayKey = calendarDayKeyInJST(),
): boolean {
  const itemKey = calendarDayKeyInJST(date);
  const elapsedDays = (dayKeyToUtcMs(todayKey) - dayKeyToUtcMs(itemKey)) / 86400000;
  return elapsedDays >= 0 && elapsedDays < withinDays;
}

function toListItem(entry: CollectionEntry<'news'>): NewsListItem {
  return {
    slug: entry.id,
    title: entry.data.title,
    date: entry.data.date,
    href: entry.data.link ?? `/news/${entry.id}/`,
  };
}

export function sortNewsByDate(items: NewsListItem[]): NewsListItem[] {
  return [...items].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export async function getPublishedNews(): Promise<NewsListItem[]> {
  const entries = await getCollection('news');
  return sortNewsByDate(entries.map(toListItem));
}

/** トップページのおしらせ表示件数 */
export const HOME_NEWS_MAX = 5;

export async function getHomeNews(): Promise<NewsListItem[]> {
  const all = await getPublishedNews();
  return all.slice(0, HOME_NEWS_MAX);
}

/** マーキー用：Markdown 本文を1行のプレーンテキストに（画像は alt ごと除去） */
export function newsBodyToPlainText(body: string): string {
  return body
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>`~]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type LatestNewsMarquee = {
  href: string;
  title: string;
  body: string;
};

/** トップおしらせマーキー（掲載日が最新の1件） */
export async function getLatestNewsMarquee(): Promise<LatestNewsMarquee | null> {
  const entries = await getCollection('news');
  if (entries.length === 0) return null;

  const latest = [...entries].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  )[0];

  const title = latest.data.title.trim();
  const body = newsBodyToPlainText(latest.body ?? '');
  if (!title && !body) return null;

  return {
    href: latest.data.link ?? `/news/${latest.id}/`,
    title,
    body,
  };
}
