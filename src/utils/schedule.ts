import {
  resolveNextPerformanceDate,
  resolvePerformanceLastDayKey,
  upcomingPerformanceDatesFromHistory,
  type PerformanceHistoryItem,
} from './performance-history';

const TZ = 'Asia/Tokyo';

/** JST の暦日（YYYY-MM-DD） */
export function calendarDayKeyInJST(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

export type EntrySchedule = {
  performanceHistory?: PerformanceHistoryItem[];
};

/** @deprecated 互換用エイリアス */
export type PerformanceSchedule = EntrySchedule;

/** @deprecated 互換用エイリアス */
export type EventSchedule = EntrySchedule;

export function entryLastDayKey(schedule: EntrySchedule): string | null {
  return resolvePerformanceLastDayKey(schedule);
}

export function performanceLastDayKey(schedule: EntrySchedule): string | null {
  return entryLastDayKey(schedule);
}

export function eventLastDayKey(schedule: EntrySchedule): string | null {
  return entryLastDayKey(schedule);
}

/** 次回公演日（今日以降の最早日）があれば「これから」 */
export function isEntryUpcoming(
  schedule: EntrySchedule,
  todayKey = calendarDayKeyInJST(),
): boolean {
  return (
    upcomingPerformanceDatesFromHistory(schedule.performanceHistory, todayKey).length > 0
  );
}

export const isPerformanceUpcoming = isEntryUpcoming;
export const isEventUpcoming = isEntryUpcoming;

export function compareEntriesUpcoming(a: EntrySchedule, b: EntrySchedule): number {
  return entryUpcomingSortKey(a) - entryUpcomingSortKey(b);
}

export function compareEntriesPast(a: EntrySchedule, b: EntrySchedule): number {
  return entryPastSortKey(b) - entryPastSortKey(a);
}

export const comparePerformancesUpcoming = compareEntriesUpcoming;
export const comparePerformancesPast = compareEntriesPast;
export const compareEventsUpcoming = compareEntriesUpcoming;
export const compareEventsPast = compareEntriesPast;

function entryUpcomingSortKey(schedule: EntrySchedule): number {
  const next = resolveNextPerformanceDate(schedule);
  if (next) return next.valueOf();

  const last = entryLastDayKey(schedule);
  return last ? new Date(last).valueOf() : Number.MAX_SAFE_INTEGER;
}

function entryPastSortKey(schedule: EntrySchedule): number {
  const last = entryLastDayKey(schedule);
  return last ? new Date(last).valueOf() : 0;
}

export { resolveNextPerformanceDate, upcomingPerformanceDatesFromHistory };
