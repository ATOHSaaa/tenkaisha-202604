import { getCollection, type CollectionEntry } from 'astro:content';
import { scheduleFromData, type EventEntry } from './event-content';
import { compareEntriesPast } from './schedule';
import { formatShowTitle } from './titles';

export type StageAdjacentLink = {
  id: string;
  title: string;
  href: string;
};

export type StageAdjacentNav = {
  prev: StageAdjacentLink | null;
  next: StageAdjacentLink | null;
};

function compareStageEntries(a: EventEntry, b: EventEntry): number {
  const byDate = compareEntriesPast(scheduleFromData(a.data), scheduleFromData(b.data));
  if (byDate !== 0) return byDate;
  return b.id.localeCompare(a.id, undefined, { numeric: true });
}

function toLink(entry: CollectionEntry<'stages'>): StageAdjacentLink {
  const title = formatShowTitle(entry.data.title);
  return {
    id: entry.id,
    title,
    href: `/stages/${entry.id}/`,
  };
}

/** 一覧（新しい順）に並べた前後の公演・イベント */
export async function getStageAdjacentNav(currentId: string): Promise<StageAdjacentNav> {
  const all = await getCollection('stages');
  const sorted = [...all].sort(compareStageEntries);
  const index = sorted.findIndex((entry) => entry.id === currentId);
  if (index === -1) {
    return { prev: null, next: null };
  }

  const prevEntry = index < sorted.length - 1 ? sorted[index + 1] : null;
  const nextEntry = index > 0 ? sorted[index - 1] : null;

  return {
    prev: prevEntry ? toLink(prevEntry) : null,
    next: nextEntry ? toLink(nextEntry) : null,
  };
}
