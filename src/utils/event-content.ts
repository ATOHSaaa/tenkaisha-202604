import type { CollectionEntry } from 'astro:content';
import { performanceDateLabel } from './dates';
import {
  pastPerformanceHistoryItems,
  performanceHistoryDayKey,
} from './performance-history';
import {
  calendarDayKeyInJST,
  compareEntriesPast,
  compareEntriesUpcoming,
  isEntryUpcoming,
  resolveNextPerformanceDate,
  type EntrySchedule,
} from './schedule';

export type EventEntry = CollectionEntry<'stages'>;
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

export type EventBadgeVariant = 'long-run' | 'event' | 'junior';

export type EventBadge = {
  badge: string;
  badgeVariant?: EventBadgeVariant;
};

const BADGE_BY_TYPE = {
  'long-run': { badge: 'ロングラン上演中！' as const, badgeVariant: 'long-run' as const },
  performance: { badge: '公演' as const, badgeVariant: undefined },
  event: { badge: 'イベント' as const, badgeVariant: 'event' as const },
};

/** 公演詳細ページ見出し下の type バッジ */
const DETAIL_BADGE_BY_TYPE = {
  'long-run': { badge: 'ロングラン' as const, badgeVariant: 'long-run' as const },
  performance: { badge: '公演' as const, badgeVariant: undefined },
  event: { badge: 'イベント' as const, badgeVariant: 'event' as const },
};

const CLASS_BADGE: Record<NonNullable<EventData['class']>, EventBadge> = {
  junior: { badge: 'ジュニアクラス', badgeVariant: 'junior' },
};

function withClassBadges(data: EventData, typeBadge: EventBadge): EventBadge[] {
  const badges: EventBadge[] = [typeBadge];
  if (data.class) badges.push(CLASS_BADGE[data.class]);
  return badges;
}

export function eventDetailBadges(data: EventData): EventBadge[] {
  return withClassBadges(data, DETAIL_BADGE_BY_TYPE[data.type]);
}

/** 一覧 `/stages/?badge=` 用 */
export const BADGE_FILTER_IDS = ['long-run', 'performance', 'event', 'junior'] as const;
export type BadgeFilterId = (typeof BADGE_FILTER_IDS)[number];

export const BADGE_FILTER_LABELS: Record<BadgeFilterId, string> = {
  'long-run': 'ロングラン',
  performance: '公演',
  event: 'イベント',
  junior: 'ジュニアクラス',
};

export function parseBadgeFilter(value: string | null): BadgeFilterId | null {
  if (!value) return null;
  return (BADGE_FILTER_IDS as readonly string[]).includes(value) ? (value as BadgeFilterId) : null;
}

export function badgeFilterId(item: EventBadge): BadgeFilterId | null {
  if (item.badgeVariant === 'junior') return 'junior';
  if (item.badgeVariant === 'long-run') return 'long-run';
  if (item.badgeVariant === 'event') return 'event';
  if (item.badge === '公演') return 'performance';
  return null;
}

export function stagesListHrefForBadge(item: EventBadge): string | undefined {
  const id = badgeFilterId(item);
  return id ? `/stages/?badge=${id}` : undefined;
}

export function entryMatchesBadgeFilter(data: EventData, filter: BadgeFilterId): boolean {
  if (filter === 'junior') return data.class === 'junior';
  return data.type === filter;
}

export function filterEntriesByBadge(all: EventEntry[], filter: BadgeFilterId): EventEntry[] {
  return all.filter((entry) => entryMatchesBadgeFilter(entry.data, filter));
}

/** @deprecated eventDetailBadges を使用 */
export function eventDetailTypeBadge(data: EventData) {
  return DETAIL_BADGE_BY_TYPE[data.type];
}

/** 一覧・トップカード用（type に応じたバッジ＋日付） */
export function eventEntryCardProps(data: EventData) {
  const typeBadge = BADGE_BY_TYPE[data.type];
  const badges = withClassBadges(data, typeBadge);
  const schedule = scheduleFromData(data);
  const nextPerformanceDate = resolveNextPerformanceDate(schedule);
  const hasNextBlock = Boolean(nextPerformanceDate);

  if (data.type === 'event') {
    return {
      badges,
      nextPerformanceDate,
      nextDateLabel: '上演日',
    };
  }

  return {
    badges,
    label: hasNextBlock ? undefined : performanceDateLabel(schedule),
    nextPerformanceDate,
  };
}

/** 「これまで」一覧用。ロングランはバッジ「ロングラン」・日付非表示 */
export function archiveEventEntryCardProps(data: EventData) {
  if (data.type === 'long-run') {
    return {
      badges: withClassBadges(data, DETAIL_BADGE_BY_TYPE['long-run']),
    };
  }
  return eventEntryCardProps(data);
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

export type ArchiveYearGroup = {
  year: string;
  entries: EventEntry[];
};

/** 「これまで」: 過去の上演日が属する年ごとにカード（複数年にまたがる公演は年ごとに重複表示） */
export function groupArchiveEntriesByYear(all: EventEntry[]): ArchiveYearGroup[] {
  const todayKey = calendarDayKeyInJST();
  const yearBuckets = new Map<string, { entry: EventEntry; sortKey: string }[]>();

  for (const entry of all) {
    const pastDates = pastPerformanceHistoryItems(entry.data.performanceHistory, todayKey);
    if (pastDates.length === 0) continue;

    const keysByYear = new Map<string, string[]>();
    for (const date of pastDates) {
      const key = performanceHistoryDayKey(date);
      if (!key) continue;
      const year = key.slice(0, 4);
      if (!keysByYear.has(year)) keysByYear.set(year, []);
      keysByYear.get(year)!.push(key);
    }

    for (const [year, keys] of keysByYear) {
      const sortKey = keys.sort().at(-1)!;
      if (!yearBuckets.has(year)) yearBuckets.set(year, []);
      yearBuckets.get(year)!.push({ entry, sortKey });
    }
  }

  return [...yearBuckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, items]) => ({
      year,
      entries: items
        .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
        .map(({ entry }) => entry),
    }))
    .filter((group) => group.entries.length > 0);
}
