import { defineConfig } from 'astro/config';
import {
  contentMarkdownReloadPlugin,
  trailingSlashDevRedirectPlugin,
} from './scripts/trailing-slash-redirect.mjs';
import remarkBreaks from 'remark-breaks';
import { rehypeWithBase } from './scripts/rehype-with-base.mjs';

const githubPages = process.env.GITHUB_PAGES === 'true';
const siteBase = githubPages ? '/tenkaisha-202604/' : '/';

// 転回社サイト設定（静的出力。本番 tenkai.org は FTP、プレビューは GitHub Pages）
export default defineConfig({
  site: githubPages ? 'https://atohsaaa.github.io' : 'https://tenkai.org',
  base: githubPages ? '/tenkaisha-202604' : undefined,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    assets: 'assets',
  },
  compressHTML: true,
  markdown: {
    remarkPlugins: [remarkBreaks],
    rehypePlugins: [[rehypeWithBase, { base: siteBase }]],
  },
  vite: {
    plugins: [trailingSlashDevRedirectPlugin(), contentMarkdownReloadPlugin()],
  },
  redirects: {
    '/events/': '/stages/',
    '/events': '/stages/',
    '/events/[...slug]': '/stages/[...slug]',
    '/stage/': '/stages/',
    '/stage': '/stages/',
    '/stage/[...slug]': '/stages/[...slug]',
    '/events/saya-minami-farewell-20260731': '/stages/077/',
    '/events/saya-minami-farewell-20260731/': '/stages/077/',
    '/events/tipitaka-202503': '/stages/063/',
    '/events/tipitaka-202503/': '/stages/063/',
  },
});
