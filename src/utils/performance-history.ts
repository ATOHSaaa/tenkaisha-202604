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

/** performanceHistory の1日分（YAML では `- 2026-11-05`） */
export type PerformanceHistoryItem = Date;

export function performanceHistoryDayKey(date: Date): string | null {
  const parsed = normalizePerformanceHistoryDate(date);
  return parsed ? performanceHistoryDayKeyFromDate(parsed) : null;
}

/** 上演履歴の表示用（例: 8月9日（土）） */
export function formatPerformanceHistoryDateLabel(date: Date): string {
  const normalized = normalizePerformanceHistoryDate(date);
  if (!normalized) return '';

  const key = performanceHistoryDayKeyFromDate(normalized);
  const [, m, d] = key.split('-').map(Number);
  const weekday = WEEKDAYS[normalized.getUTCDay()];
  return `${m}月${d}日（${weekday}）`;
}

/** 年見出し用（例: 2026） */
export function formatPerformanceHistoryYear(date: Date): string {
  const normalized = normalizePerformanceHistoryDate(date);
  if (!normalized) return 'その他';
  return performanceHistoryDayKeyFromDate(normalized).slice(0, 4);
}

/** 今日以降の公演日（昇順） */
export function upcomingPerformanceDatesFromHistory(
  items: PerformanceHistoryItem[] | undefined,
  todayKey = calendarDayKeyInJST(),
): Date[] {
  if (!items?.length) return [];

  const upcoming: Date[] = [];
  for (const item of items) {
    const parsed = normalizePerformanceHistoryDate(item);
    if (!parsed) continue;
    const key = performanceHistoryDayKeyFromDate(parsed);
    if (key >= todayKey) upcoming.push(parsed);
  }

  return upcoming.sort((a, b) => a.valueOf() - b.valueOf());
}

/** 上演履歴に載せる過去分のみ（元リストの並びを維持） */
export function pastPerformanceHistoryItems(
  items: PerformanceHistoryItem[] | undefined,
  todayKey = calendarDayKeyInJST(),
): PerformanceHistoryItem[] {
  if (!items?.length) return [];

  return items.filter((date) => {
    const key = performanceHistoryDayKey(date);
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

  for (const date of input.performanceHistory ?? []) {
    const key = performanceHistoryDayKey(date);
    if (key) keys.push(key);
  }

  if (keys.length === 0) return null;
  return keys.sort().at(-1)!;
}

/** 上演履歴を年ごとにグループ化（表示順は items の並びを維持） */
export function groupPerformanceHistoryByYear(items: PerformanceHistoryItem[]) {
  const groups: { year: string; items: { label: string }[] }[] = [];
  const yearIndex = new Map<string, number>();

  for (const date of items) {
    const year = formatPerformanceHistoryYear(date);
    const label = formatPerformanceHistoryDateLabel(date);
    const existing = yearIndex.get(year);

    if (existing === undefined) {
      yearIndex.set(year, groups.length);
      groups.push({ year, items: [{ label }] });
    } else {
      groups[existing].items.push({ label });
    }
  }

  return groups;
}
