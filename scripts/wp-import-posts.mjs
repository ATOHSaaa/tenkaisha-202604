#!/usr/bin/env node
/**
 * ink.tenkai.org のブログ投稿（/posts）を src/content/blog へ取り込む。
 * WordPress の「カテゴリー」は frontmatter の tags として保存する。
 *
 *   node scripts/wp-import-posts.mjs
 *   node scripts/wp-import-posts.mjs --dry-run
 */

import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(
  new Agent({
    connect: { timeout: 60_000 },
    headersTimeout: 120_000,
    bodyTimeout: 120_000,
  }),
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const BLOG_DIR = join(ROOT, 'src/content/blog');
const IMAGE_DIR = join(ROOT, 'public/images/blog');
const WP = (process.env.WP_REST_BASE ?? 'https://ink.tenkai.org/wp-json/wp/v2').replace(/\/$/, '');

const dryRun = process.argv.includes('--dry-run');

/** 取り込み前に削除するモック記事（WP 取り込みで置き換え） */
const MOCK_BLOG_FILES = new Set([
  '2026-03-23-sousaku.md',
  '2026-03-26-hassei.md',
  '2026-04-01-musical.md',
  '2026-04-09-junior.md',
  '2026-04-17-junior.md',
]);

function wpAuthHeaders() {
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass) return {};
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${auth}` };
}

function decodeHtml(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, ' ');
}

function stripTags(html) {
  return decodeHtml(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function yamlEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function htmlToMarkdown(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${stripTags(t)}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${stripTags(t)}\n\n`);
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
    const label = stripTags(t);
    if (!label) return href;
    return `[${label}](${href})`;
  });
  s = s.replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, (_, src) => `\n\n![](${src})\n\n`);
  s = s.replace(/<[^>]+>/g, '');
  s = decodeHtml(s);
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function rewriteImageUrls(markdown, urlMap) {
  let out = markdown;
  for (const [remote, local] of urlMap) {
    out = out.split(remote).join(local);
  }
  return out;
}

async function wpFetch(path) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await undiciFetch(`${WP}${path}`, { headers: { ...wpAuthHeaders() } });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${path} ${res.status} ${text.slice(0, 200)}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        console.warn(`  retry ${attempt}/3 ${path}`, e.message ?? e);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastErr;
}

async function wpGetJson(path) {
  return wpFetch(path).then((r) => r.json());
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return;
  const res = await undiciFetch(url, { headers: { ...wpAuthHeaders() } });
  if (!res.ok) throw new Error(`image ${url} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!dryRun) writeFileSync(destPath, buf);
}

function collectInlineImages(html) {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
}

function isLocalizableImageUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes('ink.tenkai.org') || u.pathname.includes('wp-content') || u.pathname.includes('/uploads/');
  } catch {
    return false;
  }
}

async function localizeImages(html, assetKey) {
  if (!dryRun) mkdirSync(IMAGE_DIR, { recursive: true });
  const urlMap = new Map();
  const urls = new Set(collectInlineImages(html).filter(isLocalizableImageUrl));

  let i = 0;
  for (const url of urls) {
    let ext = extname(new URL(url).pathname) || '.jpg';
    if (!/^\.(jpe?g|png|gif|webp|svg)$/i.test(ext)) ext = '.jpg';
    const name = `${assetKey}-${++i}${ext}`;
    const publicPath = `/images/blog/${name}`;
    const dest = join(IMAGE_DIR, name);
    try {
      await downloadImage(url, dest);
      urlMap.set(url, publicPath);
    } catch (e) {
      console.warn('  skip image', url, e.message);
    }
  }
  return urlMap;
}

function pickFeaturedUrl(post) {
  const embedded = post._embedded?.['wp:featuredmedia']?.[0];
  if (embedded?.source_url) return embedded.source_url;
  return null;
}

async function localizeCover(url, assetKey) {
  if (!url || !isLocalizableImageUrl(url)) return null;
  if (!dryRun) mkdirSync(IMAGE_DIR, { recursive: true });
  let ext = extname(new URL(url).pathname) || '.jpg';
  if (!/^\.(jpe?g|png|gif|webp|svg)$/i.test(ext)) ext = '.jpg';
  const name = `${assetKey}-cover${ext}`;
  const publicPath = `/images/blog/${name}`;
  const dest = join(IMAGE_DIR, name);
  try {
    await downloadImage(url, dest);
    return publicPath;
  } catch (e) {
    console.warn('  skip cover', url, e.message);
    return null;
  }
}

function wpCategoriesAsTags(post) {
  const terms = post._embedded?.['wp:term']?.flat() ?? [];
  return terms
    .filter((t) => t.taxonomy === 'category' && t.name && t.slug !== 'uncategorized')
    .map((t) => t.name);
}

function sanitizeSlug(raw) {
  let slug = decodeURIComponent(String(raw ?? ''));
  slug = slug.replace(/[^\w\u3000-\u9fff-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (slug.length > 80) slug = slug.slice(0, 80).replace(/-$/, '');
  return slug || 'post';
}

function postFilename(post) {
  const date = post.date.slice(0, 10);
  const slug = sanitizeSlug(post.slug);
  return `${date}-${slug}.md`;
}

function buildBlogMarkdown({ title, date, author, tags, excerpt, cover, body }) {
  const lines = [
    '---',
    `title: "${yamlEscape(title)}"`,
    `date: ${date}`,
    `author: "${yamlEscape(author)}"`,
  ];
  if (tags.length > 0) {
    lines.push('tags:');
    for (const t of tags) lines.push(`  - "${yamlEscape(t)}"`);
  }
  if (excerpt) lines.push(`excerpt: "${yamlEscape(excerpt)}"`);
  if (cover) lines.push(`cover: "${cover}"`);
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

async function fetchAllPosts() {
  const posts = [];
  let page = 1;
  while (true) {
    const res = await wpFetch(
      `/posts?per_page=100&page=${page}&status=publish&orderby=date&order=desc&_embed=author,wp:term,wp:featuredmedia`,
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    posts.push(...batch);
    const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? '1');
    if (page >= totalPages) break;
    page++;
  }
  return posts;
}

function removeMockPosts() {
  for (const name of MOCK_BLOG_FILES) {
    const path = join(BLOG_DIR, name);
    if (!existsSync(path)) continue;
    if (!dryRun) unlinkSync(path);
    console.log(`  removed mock ${name}`);
  }
}

async function importPost(post) {
  const title = stripTags(post.title?.rendered ?? '');
  const html = post.content?.rendered ?? '';
  const date = post.date.slice(0, 10);
  const author = post._embedded?.author?.[0]?.name ?? '転回社';
  const tags = wpCategoriesAsTags(post);
  const excerptRaw = stripTags(post.excerpt?.rendered ?? '');
  const excerpt = excerptRaw.length > 160 ? `${excerptRaw.slice(0, 157)}…` : excerptRaw;

  const assetKey = `wp-${post.id}`;
  const urlMap = await localizeImages(html, assetKey);
  let body = htmlToMarkdown(html);
  body = rewriteImageUrls(body, urlMap);

  const featuredUrl = pickFeaturedUrl(post);
  let cover = featuredUrl ? await localizeCover(featuredUrl, assetKey) : null;
  if (!cover) {
    const firstInline = [...urlMap.values()][0];
    if (firstInline) cover = firstInline;
  }

  const filename = postFilename(post);
  const content = buildBlogMarkdown({ title, date, author, tags, excerpt, cover, body });
  const path = join(BLOG_DIR, filename);

  if (!dryRun) {
    mkdirSync(BLOG_DIR, { recursive: true });
    writeFileSync(path, content, 'utf8');
  }
  console.log(`  ${dryRun ? 'would write' : 'write'} ${filename} [${tags.join(', ') || '—'}]`);
}

async function main() {
  console.log(dryRun ? 'dry-run' : 'importing blog posts…');
  if (!dryRun) removeMockPosts();

  const posts = await fetchAllPosts();
  console.log(`found ${posts.length} published posts`);

  for (const post of posts) {
    console.log(post.date.slice(0, 10), stripTags(post.title?.rendered ?? '').slice(0, 60));
    await importPost(post);
  }

  if (!dryRun) {
    const mdCount = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).length;
    console.log(`done: ${mdCount} files in src/content/blog`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
