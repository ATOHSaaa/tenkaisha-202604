import { getEmDashCollection, getEmDashEntry } from 'emdash';

export const NEWS_TAGS = ['公演', '稽古', 'おしらせ', 'ワークショップ', 'メディア'] as const;
export type NewsTag = (typeof NEWS_TAGS)[number];

export interface NewsListItem {
  slug: string;
  title: string;
  date: Date;
  tag: NewsTag;
  pinned: boolean;
  href: string;
}

export interface NewsEntryData {
  title: string;
  date: string | Date;
  tag?: string;
  pinned?: boolean;
  link?: string | null;
  slug?: string;
  content?: unknown;
}

function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

function newsHref(slug: string, link?: string | null): string {
  if (link) return link;
  return `/news/${slug}/`;
}

function toListItem(entry: { id: string; data: NewsEntryData }): NewsListItem {
  const slug = entry.data.slug ?? entry.id;
  return {
    slug,
    title: entry.data.title,
    date: parseDate(entry.data.date),
    tag: (entry.data.tag as NewsTag) ?? 'おしらせ',
    pinned: Boolean(entry.data.pinned),
    href: newsHref(slug, entry.data.link),
  };
}

export function sortNewsByDate(items: NewsListItem[]): NewsListItem[] {
  return [...items].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export async function getPublishedNews(): Promise<NewsListItem[]> {
  const { entries, error } = await getEmDashCollection('news', {
    status: 'published',
  });

  if (error) {
    throw error;
  }

  return sortNewsByDate(
    entries.map((entry) =>
      toListItem({ id: entry.id, data: entry.data as unknown as NewsEntryData })
    )
  );
}

export async function getPublishedNewsEntry(slug: string) {
  const { entry, error, isPreview } = await getEmDashEntry('news', slug);

  if (error) {
    throw error;
  }

  return {
    entry: entry ? { ...entry, data: entry.data as unknown as NewsEntryData } : null,
    isPreview,
  };
}
