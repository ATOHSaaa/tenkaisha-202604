/** base を除いたサイト内パス（/classes/foo/ など）。base が二重以上付いていても正規化 */
export function toSiteInternalPath(pathname: string): string {
  let path = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (!path.startsWith('/')) path = `/${path}`;

  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return path;

  const basePath = base.endsWith('/') ? base.slice(0, -1) : base;
  for (;;) {
    if (path === basePath || path === `${basePath}/`) return '/';
    if (path.startsWith(`${basePath}/`)) {
      path = path.slice(basePath.length) || '/';
      continue;
    }
    break;
  }
  return path;
}

/** サイト内パス・public 画像 URL に Astro base（GitHub Pages 等）を付与 */
export function withBase(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('mailto:')) {
    return path;
  }
  if (path.startsWith('#')) return path;

  const base = import.meta.env.BASE_URL;
  const root = base.endsWith('/') ? base.slice(0, -1) : base;

  if (path.startsWith('/')) {
    const internal = toSiteInternalPath(path);
    if (!root || root === '/') return internal;
    return `${root}${internal}`;
  }
  return `${base}${path}`;
}

/** Astro.url.pathname から site base を除いたパス（パンくず用） */
export function stripBasePath(pathname: string): string {
  return toSiteInternalPath(pathname);
}
