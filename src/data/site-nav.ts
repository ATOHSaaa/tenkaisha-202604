/** グローバルヘッダー用ナビ（主要下層ページ） */
export type SiteNavItem = { label: string; href: string };

export const siteHeaderNav: SiteNavItem[] = [
  { label: '公演・イベント', href: '/stages/' },
  { label: 'おしらせ', href: '/news/' },
  { label: '開講クラス', href: '/classes/' },
  { label: '劇団員紹介', href: '/members/' },
  { label: '演劇と教育', href: '/education/' },
  { label: '法人の方向け', href: '/for-organizations/' },
  { label: 'お問い合わせ', href: '/contact/' },
];
