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
    return root ? `${root}${path}` : path;
  }
  return `${base}${path}`;
}

/** Astro.url.pathname から site base を除いたパス（パンくず用） */
export function stripBasePath(pathname: string): string {
  const base = import.meta.env.BASE_URL;
  const path = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (!base || base === '/') return path;

  const basePath = base.endsWith('/') ? base.slice(0, -1) : base;
  if (path === basePath || path === `${basePath}/`) return '/';
  if (path.startsWith(`${basePath}/`)) {
    const rest = path.slice(basePath.length);
    return rest || '/';
  }
  return path;
}
