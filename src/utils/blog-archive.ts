import { getCollection, type CollectionEntry } from 'astro:content';

export const BLOG_PAGE_SIZE = 10;

export type BlogEntry = CollectionEntry<'blog'>;

export async function getSortedBlogEntries(): Promise<BlogEntry[]> {
  return (await getCollection('blog')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export function getBlogTotalPages(entryCount: number): number {
  return Math.max(1, Math.ceil(entryCount / BLOG_PAGE_SIZE));
}

export function paginateBlogEntries(entries: BlogEntry[], page: number) {
  const totalPages = getBlogTotalPages(entries.length);
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (currentPage - 1) * BLOG_PAGE_SIZE;
  return {
    items: entries.slice(start, start + BLOG_PAGE_SIZE),
    currentPage,
    totalPages,
  };
}

/** 1ページ目は /blog/、2ページ目以降は /blog/page/N/ */
export function blogArchiveHref(page: number): string {
  if (page <= 1) return '/blog/';
  return `/blog/page/${page}/`;
}

/** 一覧用タグ（WP カテゴリー → tags、なければ category） */
export function blogEntryTags(data: BlogEntry['data']): string[] {
  const tags = data.tags?.map((t) => t.trim()).filter(Boolean);
  if (tags?.length) return tags;
  const category = data.category?.trim();
  return category ? [category] : [];
}
