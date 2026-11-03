export type ClassActivityRecord = {
  sortKey: string;
  event: string;
  venue: string;
};

export type ClassMediaRecord = {
  sortKey?: string;
  period: string;
  program: string;
  outlet: string;
};

/** YYYY-MM → YYYY.MM */
export function formatClassRecordMonth(sortKey: string): string {
  const match = sortKey.match(/^(\d{4})-(\d{2})$/);
  if (match) return `${match[1]}.${match[2]}`;
  return sortKey;
}

function parseSortKey(key?: string): number {
  if (!key) return -1;
  const match = key.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2] ?? 0);
  const day = Number(match[3] ?? 0);
  return year * 10000 + month * 100 + day;
}

/** 新しい順（sortKey 降順・未設定は末尾） */
export function sortClassRecordsByMonth<T extends { sortKey?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseSortKey(b.sortKey) - parseSortKey(a.sortKey));
}

function yearGroupKey(sortKey?: string): string {
  if (!sortKey) return 'undated';
  return sortKey.slice(0, 4);
}

/** 年が変わる行の先頭に区切り線用フラグ */
export function withYearSeparators<T extends { sortKey?: string }>(
  items: T[],
): { item: T; yearSep: boolean }[] {
  let prevYear: string | null = null;
  return items.map((item) => {
    const year = yearGroupKey(item.sortKey);
    const yearSep = prevYear !== null && year !== prevYear;
    prevYear = year;
    return { item, yearSep };
  });
}
