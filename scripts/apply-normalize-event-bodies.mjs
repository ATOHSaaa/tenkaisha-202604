#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeEventBody } from './normalize-event-body.mjs';

const EVENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/content/stages');

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

  const nextBody = normalizeEventBody(parsed.body);
  if (nextBody === parsed.body) continue;

  writeFileSync(path, `---\n${parsed.yaml}\n---\n${nextBody}`, 'utf8');
  updated++;
  console.log(file);
}

console.log(`normalized ${updated} files`);
