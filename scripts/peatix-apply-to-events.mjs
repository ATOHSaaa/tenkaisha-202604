#!/usr/bin/env node
/**
 * Peatix グループ化結果を src/content/stages/*.md の performanceHistory に反映する。
 *
 *   node scripts/peatix-past-group.mjs | node scripts/peatix-apply-to-events.mjs
 *   node scripts/peatix-apply-to-events.mjs --dry-run
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupPeatixRows } from './peatix-past-group.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsDir = join(__dirname, '../src/content/stages');
const snapshotPath = join(__dirname, 'peatix-past-snapshot.json');
const dryRun = process.argv.includes('--dry-run');

/** Peatix 側の正規化タイトル → 既存ファイル名 */
const PEATIX_TO_FILE = {
  "ミュージカル『CAPPA!』": 'cappa-202604.md',
  "『齋藤道三殺生傳』": 'saito-dosan-sessho-den.md',
  '転回社ジュニアクラス夏公演『どんぐりと山猫』': 'donguri-yamaneko-20260711.md',
  '熊本ミュージカルクラブ発表会2026『Musical Kaguya Hime？』': 'musical-kaguya-hime-202605.md',
  "『鶴子の一生』": '075.md',
  "冒険奇譚ミュージカル『やくもの冒険』": '057.md',
  '転回社ジュニアクラス公演『折たく柴の記』': 'oritakushibanoki-20250517.md',
  "『大唐大慈恩寺玄奘三蔵法師伝』": '063.md',
};

function inferType(title, dateCount) {
  if (title.includes('CAPPA') || title.includes('道三') || title.includes('更級日記')) {
    return 'long-run';
  }
  if (
    /友の会|コンサート|クリスマス|ワークショップ|ジュニア|短編集|発表会|鑑賞|福袋|小集会|記念/i.test(
      title,
    )
  ) {
    return 'event';
  }
  if (dateCount >= 8 && /饗宴|細川|玄奘|鶴子/.test(title)) {
    return 'long-run';
  }
  return 'performance';
}

function slugify(title, firstDate) {
  const quoted = title.match(/『([^』]+)』/u)?.[1];
  const seed = (quoted ?? title)
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z0-9]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
  const ym = firstDate.slice(0, 7).replace('-', '');
  const ascii = seed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const tail = ascii || `event-${firstDate.replace(/-/g, '')}`;
  return `${tail}-${ym}.md`;
}

function parseFrontmatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('frontmatter missing');
  return { yaml: m[1], body: m[2] };
}

function parseHistory(yaml) {
  const lines = yaml.split('\n');
  const dates = [];
  let inHistory = false;
  for (const line of lines) {
    if (/^performanceHistory:/.test(line)) {
      inHistory = true;
      continue;
    }
    if (inHistory) {
      const m = line.match(/^\s+-\s+(\d{4}-\d{2}-\d{2})/);
      if (m) {
        dates.push(m[1]);
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

function mergeDates(existing, fromPeatix) {
  const set = new Set([...existing, ...fromPeatix]);
  return [...set].sort().reverse();
}

function siteTitleForFile(filename, peatixTitle) {
  if (filename === 'saito-dosan-sessho-den.md') {
    return "ミュージカル『斎藤道三殺生傳』";
  }
  return peatixTitle;
}

function buildNewFile(filename, peatixTitle, type, dates) {
  const title = siteTitleForFile(filename, peatixTitle);
  const yaml = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `type: ${type}`,
    'performanceHistory:',
    ...dates.map((d) => `  - ${d}`),
    '---',
    '',
    '転回社スタジオにて開催しました。',
    '',
  ].join('\n');
  return yaml;
}

const raw = JSON.parse(readFileSync(snapshotPath, 'utf8'));
const { groups } = groupPeatixRows(raw);

const usedFiles = new Set(Object.values(PEATIX_TO_FILE));
const report = { updated: [], created: [], skipped: [] };

for (const g of groups) {
  let filename = PEATIX_TO_FILE[g.title];
  if (!filename) {
    const base = slugify(g.title, g.performanceHistory[0]);
    filename = base;
    let n = 1;
    while (usedFiles.has(filename) || existsSync(join(eventsDir, filename))) {
      filename = base.replace(/\.md$/, `-${++n}.md`);
    }
  }
  usedFiles.add(filename);

  const path = join(eventsDir, filename);
  const type = inferType(g.title, g.performanceHistory.length);

  if (!existsSync(path)) {
    const content = buildNewFile(filename, g.title, type, g.performanceHistory);
    if (!dryRun) writeFileSync(path, content, 'utf8');
    report.created.push({ file: filename, title: g.title, dates: g.performanceHistory.length });
    continue;
  }

  const source = readFileSync(path, 'utf8');
  const { yaml, body } = parseFrontmatter(source);
  const existing = parseHistory(yaml);
  const merged = mergeDates(existing, g.performanceHistory);
  const unchanged =
    merged.length === existing.length &&
    merged.every((d, i) => d === [...existing].sort().reverse()[i]);
  if (unchanged) {
    report.skipped.push(filename);
    continue;
  }
  const newYaml = setHistoryInYaml(yaml, merged);
  const content = `---\n${newYaml}\n---\n${body}`;
  if (!dryRun) writeFileSync(path, content, 'utf8');
  report.updated.push({ file: filename, before: existing.length, after: merged.length });
}

console.log(JSON.stringify(report, null, 2));
console.error(
  `created ${report.created.length}, updated ${report.updated.length}, unchanged ${report.skipped.length}`,
);
