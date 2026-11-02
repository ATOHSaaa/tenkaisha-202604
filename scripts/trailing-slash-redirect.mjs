import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const INTERNAL_PREFIXES = new Set(['/_', '/@', '/.', '//']);

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** astro sync 実行中に Vite プラグインから再度 sync すると子プロセスが無限増殖する */
const ASTRO_CONTENT_SYNC_GUARD = 'TENKAISHA_ASTRO_CONTENT_SYNC';

/** getCollection が空になるのを防ぐ（.astro/data-store.json を astro sync で更新） */
function syncAstroContentStore() {
  if (process.env[ASTRO_CONTENT_SYNC_GUARD] === '1') return;

  execSync('npx astro sync', {
    cwd: PROJECT_ROOT,
    stdio: 'ignore',
    env: { ...process.env, [ASTRO_CONTENT_SYNC_GUARD]: '1' },
  });
  const src = join(PROJECT_ROOT, 'node_modules/.astro/data-store.json');
  const dst = join(PROJECT_ROOT, '.astro/data-store.json');
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}

function isContentCollectionFile(file) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.endsWith('/src/content.config.ts')) return true;
  return normalized.includes('/src/content/') && normalized.endsWith('.md');
}

/** Astro の isInternalPath と同様（Vite HMR の /@vite/client 等を除外） */
function isInternalPath(pathname) {
  const prefix = pathname.slice(0, 2).replace(/\\/g, '/');
  return INTERNAL_PREFIXES.has(prefix) && !/^\/{2,}$/.test(pathname);
}

function decodePathname(rawPath) {
  try {
    return decodeURI(rawPath);
  } catch {
    return rawPath;
  }
}

/** @param {string} pathname */
export function needsTrailingSlashRedirect(pathname) {
  if (pathname === '/' || pathname.endsWith('/')) return false;
  if (isInternalPath(pathname)) return false;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return false;
  return true;
}

function sendFullReload(server) {
  const client = server.environments?.client;
  if (client?.hot) {
    client.hot.send({ type: 'full-reload', path: '*' });
    return;
  }
  server.hot?.send({ type: 'full-reload', path: '*' });
}

/** Vite dev では Astro がスラッシュなしを 404 にするため、先に 301 する */
export function trailingSlashDevRedirectPlugin() {
  return {
    name: 'tenkaisha-trailing-slash-dev',
    enforce: 'post',
    configureServer(server) {
      return () => {
        server.middlewares.stack.unshift({
          route: '',
          handle(req, res, next) {
            const raw = req.url ?? '';
            const q = raw.indexOf('?');
            const rawPath = q === -1 ? raw : raw.slice(0, q);
            const search = q === -1 ? '' : raw.slice(q);
            const pathname = decodePathname(rawPath);

            // /@vite/client/ など末尾 / 付き内部 URL は Vite が壊れるので外す
            if (isInternalPath(pathname) && pathname.length > 1 && pathname.endsWith('/')) {
              const trimmed = pathname.replace(/\/+$/, '') || '/';
              res.writeHead(301, { Location: `${trimmed}${search}` });
              res.end();
              return;
            }

            if (!needsTrailingSlashRedirect(pathname)) return next();
            res.writeHead(301, { Location: `${pathname}/${search}` });
            res.end();
          },
        });
      };
    },
  };
}

/** content 変更時にストア同期 + full-reload（SSR dev で getCollection が空のままになるのを防ぐ） */
export function contentMarkdownReloadPlugin() {
  return {
    name: 'tenkaisha-content-markdown-reload',
    configureServer(server) {
      try {
        syncAstroContentStore();
      } catch (error) {
        console.warn('[tenkaisha] initial astro content sync failed:', error);
      }

      let syncTimer;
      const scheduleSync = () => {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          try {
            syncAstroContentStore();
          } catch (error) {
            console.warn('[tenkaisha] astro content sync failed:', error);
          }
          sendFullReload(server);
        }, 250);
      };

      for (const event of ['change', 'add', 'unlink']) {
        server.watcher.on(event, (file) => {
          if (!isContentCollectionFile(file)) return;
          scheduleSync();
        });
      }
    },
  };
}
