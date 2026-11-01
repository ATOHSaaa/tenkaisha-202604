import type { CollectionEntry } from 'astro:content';
import { performanceDateLabel } from './dates';
import {
  compareEntriesPast,
  compareEntriesUpcoming,
  isEntryUpcoming,
  resolveNextPerformanceDate,
  type EntrySchedule,
} from './schedule';

export type EventEntry = CollectionEntry<'events'>;
export type EventData = EventEntry['data'];

export type PerformanceEntry = EventEntry & {
  data: Extract<EventData, { type: 'long-run' | 'performance' }>;
};

export type GeneralEventEntry = EventEntry & {
  data: Extract<EventData, { type: 'event' }>;
};

export function isPerformanceEntry(entry: EventEntry): entry is PerformanceEntry {
  return entry.data.type === 'long-run' || entry.data.type === 'performance';
}

export function isGeneralEventEntry(entry: EventEntry): entry is GeneralEventEntry {
  return entry.data.type === 'event';
}

export function scheduleFromData(data: EventData): EntrySchedule {
  return { performanceHistory: data.performanceHistory };
}

export function isCurrentPerformance(data: PerformanceEntry['data']): boolean {
  return isEntryUpcoming(scheduleFromData(data));
}

export function isCurrentGeneralEvent(data: GeneralEventEntry['data']): boolean {
  return isEntryUpcoming(scheduleFromData(data));
}

const BADGE_BY_TYPE = {
  'long-run': { badge: 'ロングラン上演中！' as const, badgeVariant: 'long-run' as const },
  performance: { badge: '公演' as const, badgeVariant: undefined },
  event: { badge: 'イベント' as const, badgeVariant: undefined },
};

/** 一覧・トップカード用（type に応じたバッジ＋日付） */
export function eventEntryCardProps(data: EventData) {
  const { badge, badgeVariant } = BADGE_BY_TYPE[data.type];
  const schedule = scheduleFromData(data);
  const nextPerformanceDate = resolveNextPerformanceDate(schedule);
  const hasNextBlock = Boolean(nextPerformanceDate);

  if (data.type === 'event') {
    return {
      badge,
      badgeVariant,
      nextPerformanceDate,
      nextDateLabel: '上演日',
    };
  }

  return {
    badge,
    badgeVariant,
    label: hasNextBlock ? undefined : performanceDateLabel(schedule),
    nextPerformanceDate,
  };
}

export function partitionEventList(all: EventEntry[]) {
  const performances = all.filter(isPerformanceEntry);
  const generalEvents = all.filter(isGeneralEventEntry);

  const currentPerformances = performances
    .filter((p) => isCurrentPerformance(p.data))
    .sort((a, b) => compareEntriesUpcoming(scheduleFromData(a.data), scheduleFromData(b.data)));

  const currentEvents = generalEvents
    .filter((e) => isCurrentGeneralEvent(e.data))
    .sort((a, b) => compareEntriesUpcoming(scheduleFromData(a.data), scheduleFromData(b.data)));

  const archivePerformances = performances
    .filter((p) => !isCurrentPerformance(p.data))
    .sort((a, b) => compareEntriesPast(scheduleFromData(a.data), scheduleFromData(b.data)));

  const archiveEvents = generalEvents
    .filter((e) => !isCurrentGeneralEvent(e.data))
    .sort((a, b) => compareEntriesPast(scheduleFromData(a.data), scheduleFromData(b.data)));

  return {
    currentPerformances,
    currentEvents,
    archivePerformances,
    archiveEvents,
  };
}
