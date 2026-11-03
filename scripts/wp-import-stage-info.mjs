#!/usr/bin/env node
/**
 * ink.tenkai.org の公演固定ページ（[NN]… / stage-info 下層）を取り込む。
 *
 *   node scripts/wp-import-stage-info.mjs
 *   node scripts/wp-import-stage-info.mjs --dry-run
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
import { normalizeEventBody } from './normalize-event-body.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** リポジトリ直下の .env を読む（既に process.env にあれば上書きしない） */
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

const EVENTS_DIR = join(ROOT, 'src/content/stages');
const IMAGE_DIR = join(ROOT, 'public/images/events/stages');
const WP = (process.env.WP_REST_BASE ?? 'https://ink.tenkai.org/wp-json/wp/v2').replace(/\/$/, '');

function wpAuthHeaders() {
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass) return {};
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${auth}` };
}
const dryRun = process.argv.includes('--dry-run');
const stageFilter = process.argv.find((a) => a.startsWith('--stage='))?.slice('--stage='.length)?.padStart(3, '0');

/** サイトに載せない公演（stage 番号） */
const SKIP_STAGE_NUMBERS = new Set([]);

/** 取り込み先を既存ファイルに寄せる（stage 番号 → ファイル名） */
const STAGE_TO_EXISTING = {
  '063': '063.md',
};

/** 日付だけ long-run に合流（個別 stage MD は作らない） */
const LONG_RUN_BY_PATTERN = [
  { pattern: /CAPPA/i, file: 'cappa-202604.md' },
  { pattern: /道三|斎藤道三|齋藤道三/i, file: 'saito-dosan-sessho-den.md' },
];

/** long-run 合流の対象外（個別ページとして残す stage 番号） */
const LONG_RUN_MERGE_SKIP = new Set(['021', '013']);

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
  return decodeHtml(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseStageNumber(title) {
  const m = title.match(/^\[(\d+)\]/);
  return m ? m[1].padStart(3, '0') : null;
}

function cleanTitle(title) {
  return decodeHtml(title)
    .replace(/^\[\d+\]/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractScheduleSection(html) {
  const h2 = html.match(/<h2[^>]*>\s*日時\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (h2) return h2[1];
  const h3 = html.match(/<h3[^>]*>[^<]*日時[^<]*<\/h3>([\s\S]*?)(?=<h[23]|$)/i);
  if (h3) return h3[1];
  return html;
}

function parseDatesFromHtml(html, modifiedIso) {
  const text = stripTags(html);
  const dates = new Set();
  for (const m of text.matchAll(/(20\d{2})年(\d{1,2})月(\d{1,2})日/g)) {
    dates.add(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`);
  }
  if (dates.size > 0) return [...dates].sort().reverse();

  let contextYear = modifiedIso ? Number(modifiedIso.slice(0, 4)) : 2026;
  for (const line of text.split(/\s+/)) {
    const ym = line.match(/^(20\d{2})年$/);
    if (ym) contextYear = Number(ym[1]);
  }
  for (const m of text.matchAll(/(20\d{2})年[\s\S]*?(\d{1,2})月(\d{1,2})日/g)) {
    dates.add(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`);
  }
  if (dates.size > 0) return [...dates].sort().reverse();

  const refYear = contextYear;
  for (const m of text.matchAll(/(\d{1,2})月(\d{1,2})日/g)) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    for (const y of [refYear, refYear - 1, refYear - 2]) {
      const iso = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(`${iso}T12:00:00+09:00`);
      if (d.getFullYear() === y && d.getMonth() + 1 === month && d.getDate() === day) {
        dates.add(iso);
        break;
      }
    }
  }
  return [...dates].sort().reverse();
}

function inferEventType(title) {
  if (/CAPPA|道三|斎藤道三|齋藤道三|更級日記|饗宴|玄奘三蔵|鶴子の一生/.test(title)) {
    if (/CAPPA|道三|斎藤|齋藤|更級日記/.test(title)) return 'long-run';
    return 'performance';
  }
  if (/友の会|コンサート|クリスマス|ワークショップ|ジュニア|短編集|発表会|鑑賞|福袋|小集会|記念|説明会|プレ/.test(title)) {
    return 'event';
  }
  return 'performance';
}

/** WP 本文 HTML → 簡易 Markdown */
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

async function wpGet(path) {
  const res = await fetch(`${WP}${path}`, { headers: { ...wpAuthHeaders() } });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) return;
  const res = await fetch(url, { headers: { ...wpAuthHeaders() } });
  if (!res.ok) throw new Error(`image ${url} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!dryRun) writeFileSync(destPath, buf);
}

function parseFrontmatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  return { yaml: m[1], body: m[2] };
}

function parseHistory(yaml) {
  const dates = [];
  let inHistory = false;
  for (const line of yaml.split('\n')) {
    if (/^performanceHistory:/.test(line)) {
      inHistory = true;
      continue;
    }
    if (inHistory) {
      const hm = line.match(/^\s+-\s+(\d{4}-\d{2}-\d{2})/);
      if (hm) {
        dates.push(hm[1]);
        continue;
      }
      if (/^\S/.test(line)) inHistory = false;
    }
  }
  return dates;
}

function setHistoryInYaml(yaml, mergedDates) {
  const lines = yaml.split('\n');
  const out = [];
  let inHistory = false;
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^performanceHistory:/.test(line)) {
      inHistory = true;
      replaced = true;
      out.push('performanceHistory:');
      for (const d of mergedDates) out.push(`  - ${d}`);
      while (i + 1 < lines.length && /^\s+-\s+\d{4}-\d{2}-\d{2}/.test(lines[i + 1])) i++;
      continue;
    }
    if (inHistory && /^\S/.test(line)) inHistory = false;
    out.push(line);
  }
  if (!replaced) {
    out.push('performanceHistory:');
    for (const d of mergedDates) out.push(`  - ${d}`);
  }
  return out.join('\n');
}

function setCoverInYaml(yaml, cover) {
  if (/^cover:/m.test(yaml)) {
    return yaml.replace(/^cover:.*$/m, `cover: "${cover}"`);
  }
  const lines = yaml.split('\n');
  const out = [];
  for (const line of lines) {
    out.push(line);
    if (/^type:/.test(line)) out.push(`cover: "${cover}"`);
  }
  return out.join('\n');
}

function mergeDates(a, b) {
  const valid = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00+09:00`));
  return [...new Set([...a, ...b].filter(valid))].sort().reverse();
}

function yamlEscape(title) {
  return title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildMarkdown({ title, type, cover, dates, body, tickets }) {
  const lines = [
    '---',
    `title: "${yamlEscape(title)}"`,
    `type: ${type}`,
  ];
  if (cover) lines.push(`cover: "${cover}"`);
  if (tickets?.length) {
    lines.push('tickets:');
    for (const t of tickets) {
      lines.push(`  - label: ${t.label}`);
      lines.push(`    url: ${t.url}`);
    }
  }
  lines.push('performanceHistory:');
  for (const d of dates) lines.push(`  - ${d}`);
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

function parseTickets(_yaml) {
  return undefined;
}

async function resolveFeaturedUrl(featuredMediaId) {
  if (!featuredMediaId) return null;
  try {
    const media = await wpGet(`/media/${featuredMediaId}?_fields=source_url,media_details`);
    return media.source_url ?? null;
  } catch {
    return null;
  }
}

function collectInlineImages(html) {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]);
}

async function localizeImages(html, stageKey) {
  if (!dryRun) mkdirSync(IMAGE_DIR, { recursive: true });
  const urlMap = new Map();
  const urls = new Set(collectInlineImages(html));

  let i = 0;
  for (const url of urls) {
    if (!url.includes('ink.tenkai.org') && !url.includes('wp-content')) continue;
    const ext = extname(new URL(url).pathname) || '.jpg';
    const name = `${stageKey}-${++i}${ext}`;
    const publicPath = `/images/events/stages/${name}`;
    const dest = join(IMAGE_DIR, name);
    try {
      await downloadImage(url, dest);
      urlMap.set(url, publicPath);
    } catch (e) {
      console.warn('skip image', url, e.message);
    }
  }
  return urlMap;
}

async function pickCover(page, stageKey, html) {
  const featured = await resolveFeaturedUrl(page.featured_media);
  const inline = collectInlineImages(html).find((u) => /\.(jpe?g|png|webp)/i.test(u));
  const url = featured || inline;
  if (!url) return null;

  const ext = extname(new URL(url).pathname) || '.jpg';
  const name = `${stageKey}-cover${ext}`;
  const publicPath = `/images/events/stages/${name}`;
  const dest = join(IMAGE_DIR, name);
  try {
    await downloadImage(url, dest);
    return publicPath;
  } catch {
    return null;
  }
}

async function fetchStagePages() {
  const pages = await wpGet('/pages?per_page=100&_fields=id,slug,link,title,content,featured_media,modified');
  return pages.filter(
    (p) =>
      /\[\d+\]/.test(p.title?.rendered ?? '') ||
      /\/stage-info\/stage/i.test(p.link ?? '') ||
      /^stage\d/i.test(p.slug ?? ''),
  );
}

async function updateLongRun(file, dates, cover) {
  const path = join(EVENTS_DIR, file);
  if (!existsSync(path)) return;
  const { yaml, body } = parseFrontmatter(readFileSync(path, 'utf8'));
  const existing = parseHistory(yaml);
  const merged = mergeDates(existing, dates);
  let newYaml = setHistoryInYaml(yaml, merged);
  if (cover && !/^cover:/m.test(yaml)) newYaml = setCoverInYaml(newYaml, cover);
  const out = `---\n${newYaml}\n---\n${body}`;
  if (!dryRun) writeFileSync(path, out, 'utf8');
  console.log(`  long-run ${file}: +${merged.length - existing.length} dates`);
}

async function importStagePage(page) {
  const rawTitle = page.title.rendered;
  const stageNum = parseStageNumber(rawTitle);
  if (!stageNum) return;
  if (SKIP_STAGE_NUMBERS.has(stageNum)) return;

  const title = cleanTitle(rawTitle);
  const html = page.content?.rendered ?? '';
  const scheduleHtml = extractScheduleSection(html);
  let dates = parseDatesFromHtml(scheduleHtml, page.modified);
  if (dates.length === 0) dates = parseDatesFromHtml(html, page.modified);
  if (dates.length === 0 && page.modified) {
    dates.push(page.modified.slice(0, 10));
  }

  const assetKey = `stage-${stageNum}`;
  const urlMap = await localizeImages(html, assetKey);
  let mdBody = htmlToMarkdown(html);
  mdBody = rewriteImageUrls(mdBody, urlMap);
  mdBody = normalizeEventBody(mdBody);
  const cover = await pickCover(page, assetKey, html);
  if (cover) mdBody = mdBody.replace(/!\[\]\([^)]+\)\s*\n\n!\[\]\([^)]+\)/, `![](${cover})`);

  for (const lr of LONG_RUN_BY_PATTERN) {
    if (LONG_RUN_MERGE_SKIP.has(stageNum)) break;
    if (lr.pattern.test(title)) {
      await updateLongRun(lr.file, dates, cover);
      return { kind: 'long-run', stageNum, title };
    }
  }

  const existingFile = STAGE_TO_EXISTING[stageNum];
  const targetName = existingFile ?? `${stageNum}.md`;
  const path = join(EVENTS_DIR, targetName);

  let type = inferEventType(title);
  if (stageNum === '021' || stageNum === '013') type = 'performance';
  let body = mdBody;
  let tickets;

  if (existsSync(path)) {
    const parsed = parseFrontmatter(readFileSync(path, 'utf8'));
    if (parsed) {
      const yaml = parsed.yaml;
      const keepBody =
        existingFile &&
        parsed.body.trim().length > 80 &&
        !parsed.body.includes('転回社スタジオにて開催しました。');
      body = keepBody ? parsed.body : mdBody;
      const existing = parseHistory(yaml);
      const merged = mergeDates(existing, dates);
      let newYaml = setHistoryInYaml(yaml, merged);
      if (cover) newYaml = setCoverInYaml(newYaml, cover);
      const out = `---\n${newYaml}\n---\n${body}`;
      if (!dryRun) writeFileSync(path, out, 'utf8');
      console.log(`  update ${targetName}`);
      return { kind: 'update', stageNum, title };
    }
  }

  if (targetName === 'cappa-202604.md' || targetName === 'saito-dosan-sessho-den.md') {
    type = 'long-run';
  }

  const content = buildMarkdown({
    title: targetName === 'saito-dosan-sessho-den.md' ? "ミュージカル『斎藤道三殺生傳』" : title,
    type,
    cover,
    dates,
    body,
    tickets,
  });
  if (!dryRun) writeFileSync(path, content, 'utf8');
  console.log(`  write ${targetName}`);
  return { kind: 'write', stageNum, title };
}

function cleanupPeatixStubs() {
  const files = readdirSync(EVENTS_DIR);
  let removed = 0;
  for (const f of files) {
    if (/-2\.md$/.test(f)) {
      if (!dryRun) unlinkSync(join(EVENTS_DIR, f));
      removed++;
      continue;
    }
    if (!/^event-/.test(f) && !/^2-20/.test(f) && !/^10-20/.test(f) && !/^vol-1-/.test(f) && !/^comico-/.test(f) && !/^studio-/.test(f) && !/^in-cafe/.test(f) && !/^in-caf/.test(f)) continue;
    const text = readFileSync(join(EVENTS_DIR, f), 'utf8');
    if (!text.includes('転回社スタジオにて開催しました。')) continue;
    if (!dryRun) unlinkSync(join(EVENTS_DIR, f));
    removed++;
  }
  console.log(`cleanup: removed ${removed} peatix stub/duplicate files`);
}

async function main() {
  console.log(dryRun ? 'dry-run' : 'importing…');
  const stages = await fetchStagePages();
  console.log(`found ${stages.length} stage pages`);
  stages.sort((a, b) => {
    const na = parseStageNumber(a.title.rendered) ?? '999';
    const nb = parseStageNumber(b.title.rendered) ?? '999';
    return na.localeCompare(nb);
  });

  for (const page of stages) {
    const num = parseStageNumber(page.title.rendered);
    if (stageFilter && num !== stageFilter) continue;
    console.log(num, cleanTitle(page.title.rendered).slice(0, 50));
    await importStagePage(page);
  }

  if (!stageFilter) cleanupPeatixStubs();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
