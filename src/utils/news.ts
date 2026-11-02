import { getCollection, type CollectionEntry } from 'astro:content';

export interface NewsListItem {
  slug: string;
  title: string;
  date: Date;
  href: string;
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
