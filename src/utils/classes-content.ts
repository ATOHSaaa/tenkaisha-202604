import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { withBase } from './path';

export type ClassEntry = CollectionEntry<'classes'>;

export function isStandaloneClassEntry(entry: ClassEntry): boolean {
  return !entry.data.appendTo;
}

export function classDetailHref(entry: ClassEntry | string): string {
  const id = typeof entry === 'string' ? entry : entry.id;
  return withBase(`/classes/${id}/`);
}

export async function getClassEntries(): Promise<ClassEntry[]> {
  const all = await getCollection('classes');
  return all
    .filter(isStandaloneClassEntry)
    .sort(
      (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ja'),
    );
}

export async function getHomeClassEntries(): Promise<ClassEntry[]> {
  return (await getClassEntries()).filter((entry) => entry.data.showOnHome);
}

/** クラス詳細で講師の下に差し込む追記 Markdown */
export async function getClassAppendEntries(classId: string): Promise<ClassEntry[]> {
  const all = await getCollection('classes');
  return all
    .filter((entry) => entry.data.appendTo === classId)
    .sort((a, b) => a.data.order - b.data.order);
}
