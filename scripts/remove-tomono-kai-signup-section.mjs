#!/usr/bin/env node
/**
 * 公演 Markdown から「## 友の会入会方法」ブロック（友の会 / 友の会オフライン会 含む）を削除する。
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/content/stages');

const MEMBER_HEADINGS = new Set([
  '## 友の会入会方法',
  '## 友の会',
  '## 友の会オフライン会',
]);

function isMemberSectionHeading(line) {
  return MEMBER_HEADINGS.has(line.trim());
}

function removeMemberSignupSection(body) {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## 友の会入会方法');
  if (start === -1) return body;

  let end = start;
  for (let i = start + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('## ') && !isMemberSectionHeading(trimmed)) {
      end = i;
      break;
    }
    if (i === lines.length - 1) end = lines.length;
  }

  const kept = [...lines.slice(0, start), ...lines.slice(end)];
  while (kept.length > 1 && kept[kept.length - 1] === '' && kept[kept.length - 2] === '') {
    kept.pop();
  }
  if (start > 0 && kept[start - 1] === '' && (end >= lines.length || lines[end]?.trim().startsWith('## '))) {
    // drop blank line before next section
    const blankBefore = start - 1;
    if (kept[blankBefore] === '') kept.splice(blankBefore, 1);
  }
  return `${kept.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function parseFrontmatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  return { yaml: m[1], body: m[2] };
}

let updated = 0;
for (const file of readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(EVENTS_DIR, file);
  const parsed = parseFrontmatter(readFileSync(path, 'utf8'));
  if (!parsed) continue;
  if (!parsed.body.includes('## 友の会入会方法')) continue;

  const nextBody = removeMemberSignupSection(parsed.body);
  if (nextBody === parsed.body) continue;

  writeFileSync(path, `---\n${parsed.yaml}\n---\n${nextBody}`, 'utf8');
  updated++;
  console.log(file);
}

console.log(`removed section from ${updated} files`);
