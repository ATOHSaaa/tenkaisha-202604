import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';

// 転回社サイト設定
// EmDash ローカル検証のため SSR モード。本番 FTP 静的配信とは別運用。
export default defineConfig({
  site: 'https://tenkai.org',
  trailingSlash: 'always',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  build: {
    format: 'directory',
    assets: 'assets',
  },
  compressHTML: true,
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: 'file:./data.db' }),
      storage: local({
        directory: './uploads',
        baseUrl: '/_emdash/api/media/file',
      }),
    }),
  ],
});
