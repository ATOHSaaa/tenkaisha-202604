import { parseBadgeFilter } from './event-content';
import { withBase, stripBasePath } from './path';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** URL 第1セグメント → 一覧ページのラベル */
const SEGMENT_LABELS: Record<string, string> = {
  news: 'おしらせ',
  stages: '公演・イベント',
  performances: '公演・イベント',
  classes: '開講クラス',
  blog: '日々のこと',
  publications: '刊行物',
  members: '劇団員紹介',
  'for-organizations': '法人の方向け',
  contact: 'お問い合わせ',
  education: '演劇と教育',
  supporter: '友の会',
  studios: 'スタジオ所在地',
};

function normalizePathname(pathname: string): string {
  const path = stripBasePath(pathname);
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

function segmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

function withBaseOnItems(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items.map((item) =>
    item.href ? { ...item, href: withBase(item.href) } : item,
  );
}

export function buildBreadcrumbs(
  pathname: string,
  _currentPageTitle?: string,
  searchParams?: URLSearchParams,
): BreadcrumbItem[] {
  const normalized = normalizePathname(pathname);
  if (normalized === '/') return [];

  const segments = normalized.split('/').filter(Boolean);

  /** 公演詳細: 一覧まで（作品名・現在ページ名は出さない） */
  if (segments[0] === 'stages' && segments.length > 1) {
    return withBaseOnItems([
      { label: 'Top', href: '/' },
      { label: SEGMENT_LABELS.stages!, href: '/stages/' },
    ]);
  }

  /** 公演一覧（バッジ絞り込み時は h1 ラベルをパンくずに含めない） */
  if (segments[0] === 'stages' && segments.length === 1) {
    const badgeFilter = parseBadgeFilter(searchParams?.get('badge') ?? null);
    if (badgeFilter) {
      return withBaseOnItems([
        { label: 'Top', href: '/' },
        { label: SEGMENT_LABELS.stages!, href: '/stages/' },
      ]);
    }
    return withBaseOnItems([{ label: 'Top', href: '/' }]);
  }

  const items: BreadcrumbItem[] = [{ label: 'Top', href: '/' }];
  const lastSegmentIndex = segments.length - 1;

  let acc = '';
  for (let i = 0; i < lastSegmentIndex; i++) {
    const segment = segments[i]!;
    acc += `/${segment}`;
    const label = segmentLabel(segment);

    items.push({ label, href: `${acc}/` });
  }

  return withBaseOnItems(items);
}
