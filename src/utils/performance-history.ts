const TZ = 'Asia/Tokyo';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LEGACY_JA_DATE = /^(\d{4})年(\d{1,2})月(\d{1,2})日/;

function calendarDayKeyInJST(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** JST の暦日キー（YYYY-MM-DD） */
export function performanceHistoryDayKeyFromDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** 暦日を JST 正午 UTC で正規化（曜日・比較用） */
export function normalizePerformanceHistoryDate(input: Date | string): Date | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    const key = performanceHistoryDayKeyFromDate(input);
    const [y, m, d] = key.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  if (typeof input !== 'string') return null;

  const iso = input.match(ISO_DAY);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  const legacy = input.match(LEGACY_JA_DATE);
  if (legacy) {
    const y = Number(legacy[1]);
    const m = Number(legacy[2]);
    const d = Number(legacy[3]);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  return null;
}

export type PerformanceHistoryEntry = {
  date: Date;
  time?: string;
  url?: string;
};

/** performanceHistory の1件（YAML `- 2026-11-05` または `{ date, time?, url? }`） */
export type PerformanceHistoryItem = Date | PerformanceHistoryEntry;

export type NormalizedPerformanceHistoryItem = {
  date: Date;
  time?: string;
  url?: string;
};

export function normalizePerformanceHistoryEntry(
  item: PerformanceHistoryItem,
): NormalizedPerformanceHistoryItem | null {
  if (item instanceof Date) {
    const parsed = normalizePerformanceHistoryDate(item);
    return parsed ? { date: parsed } : null;
  }

  if (item && typeof item === 'object' && 'date' in item) {
    const parsed = normalizePerformanceHistoryDate(item.date);
    if (!parsed) return null;
    return { date: parsed, time: item.time, url: item.url };
  }

  return null;
}

/** フロントマターの url を優先し、なければ resolveLink（Peatix 推測など） */
export function performanceHistoryHref(
  item: PerformanceHistoryItem,
  resolveLink?: (item: PerformanceHistoryItem) => string | undefined,
): string | undefined {
  const normalized = normalizePerformanceHistoryEntry(item);
  if (normalized?.url) return normalized.url;
  return resolveLink?.(item);
}

export function performanceHistoryDayKey(item: PerformanceHistoryItem): string | null {
  const normalized = normalizePerformanceHistoryEntry(item);
  return normalized ? performanceHistoryDayKeyFromDate(normalized.date) : null;
}

/** 上演履歴の表示用（例: 8月9日(土) 19:00） */
export function formatPerformanceHistoryDateLabel(
  item: PerformanceHistoryItem,
  options?: { includeTime?: boolean },
): string {
  const normalized = normalizePerformanceHistoryEntry(item);
  if (!normalized) return '';

  const base = formatPerformanceHistoryCalendarLabel(normalized.date);
  if (options?.includeTime && normalized.time) {
    return `${base} ${normalized.time}`;
  }
  return base;
}

/** 月日曜日のみ（例: 8月9日(土)） */
export function formatPerformanceHistoryCalendarLabel(date: Date): string {
  const normalized = normalizePerformanceHistoryDate(date);
  if (!normalized) return '';

  const key = performanceHistoryDayKeyFromDate(normalized);
  const [, m, d] = key.split('-').map(Number);
  const weekday = WEEKDAYS[normalized.getUTCDay()];
  return `${m}月${d}日(${weekday})`;
}

function comparePerformanceTime(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return ah * 60 + am - (bh * 60 + bm);
}

export type PerformanceHistoryDisplayPart = { text: string; href?: string };

export type PerformanceHistoryDisplayItem = {
  label: string;
  href?: string;
  parts?: PerformanceHistoryDisplayPart[];
};

function buildMergedDayDisplay(
  date: Date,
  slots: { time?: string; href?: string }[],
): PerformanceHistoryDisplayItem {
  const base = formatPerformanceHistoryCalendarLabel(date);
  const timed = slots
    .filter((s): s is { time: string; href?: string } => Boolean(s.time))
    .sort((a, b) => comparePerformanceTime(a.time, b.time));

  if (timed.length === 0) {
    const href = slots.find((s) => s.href)?.href;
    return { label: base, href };
  }

  if (timed.length === 1) {
    return { label: `${base} ${timed[0].time}`, href: timed[0].href };
  }

  const timeLabel = timed.map((s) => s.time).join(' / ');
  const label = `${base} ${timeLabel}`;
  const hrefs = [...new Set(timed.map((s) => s.href).filter(Boolean))];

  if (hrefs.length === 1) {
    return { label, href: hrefs[0] };
  }

  if (hrefs.length === 0) {
    return { label };
  }

  const parts: PerformanceHistoryDisplayPart[] = [
    { text: `${base} ${timed[0].time}`, href: timed[0].href },
  ];
  for (let index = 1; index < timed.length; index++) {
    parts.push({ text: ' / ' });
    parts.push({ text: timed[index].time, href: timed[index].href });
  }
  return { label, parts };
}

/** 年見出し用（例: 2026） */
export function formatPerformanceHistoryYear(item: PerformanceHistoryItem): string {
  const normalized = normalizePerformanceHistoryEntry(item);
  if (!normalized) return 'その他';
  return performanceHistoryDayKeyFromDate(normalized.date).slice(0, 4);
}

/** 今日以降の公演日（昇順・暦日単位で重複除去） */
export function upcomingPerformanceDatesFromHistory(
  items: PerformanceHistoryItem[] | undefined,
  todayKey = calendarDayKeyInJST(),
): Date[] {
  if (!items?.length) return [];

  const seen = new Set<string>();
  const upcoming: Date[] = [];
  for (const item of items) {
    const normalized = normalizePerformanceHistoryEntry(item);
    if (!normalized) continue;
    const key = performanceHistoryDayKeyFromDate(normalized.date);
    if (key >= todayKey && !seen.has(key)) {
      seen.add(key);
      upcoming.push(normalized.date);
    }
  }

  return upcoming.sort((a, b) => a.valueOf() - b.valueOf());
}

/** 上演履歴に載せる過去分のみ（元リストの並びを維持） */
export function pastPerformanceHistoryItems(
  items: PerformanceHistoryItem[] | undefined,
  todayKey = calendarDayKeyInJST(),
): PerformanceHistoryItem[] {
  if (!items?.length) return [];

  return items.filter((item) => {
    const key = performanceHistoryDayKey(item);
    return key !== null && key < todayKey;
  });
}

/** 履歴から次回公演日（今日以降の最早日） */
export function resolveNextPerformanceDate(input: {
  performanceHistory?: PerformanceHistoryItem[];
}): Date | undefined {
  return upcomingPerformanceDatesFromHistory(input.performanceHistory)[0];
}

/** スケジュール上の最終日（履歴の最大日） */
export function resolvePerformanceLastDayKey(input: {
  performanceHistory?: PerformanceHistoryItem[];
}): string | null {
  const keys: string[] = [];

  for (const item of input.performanceHistory ?? []) {
    const key = performanceHistoryDayKey(item);
    if (key) keys.push(key);
  }

  if (keys.length === 0) return null;
  return keys.sort().at(-1)!;
}

/** 上演履歴を年ごとにグループ化（表示順は items の並びを維持） */
export function groupPerformanceHistoryByYear(
  items: PerformanceHistoryItem[],
  resolveLink?: (item: PerformanceHistoryItem) => string | undefined,
  options?: { includeTime?: boolean },
) {
  if (options?.includeTime) {
    return groupPerformanceHistoryByYearWithMergedDays(items, resolveLink);
  }

  const groups: { year: string; items: PerformanceHistoryDisplayItem[] }[] = [];
  const yearIndex = new Map<string, number>();

  for (const item of items) {
    const year = formatPerformanceHistoryYear(item);
    const label = formatPerformanceHistoryDateLabel(item, options);
    const href = performanceHistoryHref(item, resolveLink);
    const existing = yearIndex.get(year);

    if (existing === undefined) {
      yearIndex.set(year, groups.length);
      groups.push({ year, items: [{ label, href }] });
    } else {
      groups[existing].items.push({ label, href });
    }
  }

  return groups;
}

function groupPerformanceHistoryByYearWithMergedDays(
  items: PerformanceHistoryItem[],
  resolveLink?: (item: PerformanceHistoryItem) => string | undefined,
) {
  type DayBucket = {
    year: string;
    date: Date;
    order: number;
    slots: { time?: string; href?: string }[];
  };

  const buckets = new Map<string, DayBucket>();
  let order = 0;

  for (const item of items) {
    const normalized = normalizePerformanceHistoryEntry(item);
    if (!normalized) continue;

    const dayKey = performanceHistoryDayKeyFromDate(normalized.date);
    const year = dayKey.slice(0, 4);
    const bucketKey = `${year}#${dayKey}`;
    let bucket = buckets.get(bucketKey);
    if (!bucket) {
      bucket = { year, date: normalized.date, order: order++, slots: [] };
      buckets.set(bucketKey, bucket);
    }

    bucket.slots.push({
      time: normalized.time,
      href: performanceHistoryHref(item, resolveLink),
    });
  }

  const groups: { year: string; items: PerformanceHistoryDisplayItem[] }[] = [];
  const yearIndex = new Map<string, number>();

  for (const bucket of [...buckets.values()].sort((a, b) => a.order - b.order)) {
    const display = buildMergedDayDisplay(bucket.date, bucket.slots);
    const existing = yearIndex.get(bucket.year);

    if (existing === undefined) {
      yearIndex.set(bucket.year, groups.length);
      groups.push({ year: bucket.year, items: [display] });
    } else {
      groups[existing].items.push(display);
    }
  }

  return groups;
}
