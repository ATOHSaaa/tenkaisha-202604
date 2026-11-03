import { resolvePersonCredits, type PersonCredit } from '../data/people';
import {
  schoolPamphletSpecDefault,
  type SchoolPamphletSpecRow,
} from '../data/school-pamphlet-spec-default';
import type { CollectionEntry } from 'astro:content';
import { getCollection, getEntry } from 'astro:content';
import { withBase } from './path';

export type SchoolEntry = CollectionEntry<'school'>;
export type SchoolTargetLevel = SchoolEntry['data']['targets'][number];

export const schoolTargetOrder: SchoolTargetLevel[] = ['小学生', '中学生', '高校生'];

export type SchoolSpecRow = SchoolPamphletSpecRow;

export type SchoolSourceCredit = NonNullable<SchoolEntry['data']['sourceCredit']>;

type SchoolPamphletData = NonNullable<SchoolEntry['data']['pamphlet']>;

export type ResolvedSchoolPamphlet = Omit<
  SchoolPamphletData,
  'script' | 'direction' | 'cast' | 'music' | 'spec'
> & {
  script: PersonCredit[];
  direction: PersonCredit[];
  cast: PersonCredit[];
  music: PersonCredit[];
  spec: SchoolSpecRow[];
};

export function resolveSchoolPamphletSpec(
  spec: SchoolPamphletData['spec'],
  duration?: string,
): SchoolSpecRow[] {
  const rows: SchoolSpecRow[] =
    spec === 'default'
      ? schoolPamphletSpecDefault.map((row) => ({ ...row }))
      : spec.map((row) => ({ ...row }));

  if (duration) {
    return rows.map((row) =>
      row.label === '公演時間' ? { ...row, value: duration } : row,
    );
  }

  return rows;
}

export function resolveSchoolPamphlet(
  pamphlet: SchoolPamphletData,
  options?: { duration?: string },
): ResolvedSchoolPamphlet {
  const { spec, script, direction, cast, music, ...rest } = pamphlet;
  return {
    ...rest,
    spec: resolveSchoolPamphletSpec(spec, options?.duration),
    script: resolvePersonCredits(script),
    direction: resolvePersonCredits(direction),
    cast: resolvePersonCredits(cast),
    music: resolvePersonCredits(music),
  };
}

const schoolSlugAliases: Record<string, string> = {
  'ogawa-unmei': 'ogawa-mimei',
};

export function resolveSchoolSlug(id: string): string {
  return schoolSlugAliases[id] ?? id;
}

export function getSchoolSlugAliasSlugs(): string[] {
  return Object.keys(schoolSlugAliases);
}

export function schoolPieceHref(entry: SchoolEntry | string): string {
  const id = typeof entry === 'string' ? resolveSchoolSlug(entry) : entry.id;
  return withBase(`/education/school/${id}/`);
}

export function schoolEntryHasPage(entry: SchoolEntry): boolean {
  return entry.data.page;
}

export async function getSchoolEntries(): Promise<SchoolEntry[]> {
  const all = await getCollection('school');
  return all.sort(
    (a, b) => a.data.order - b.data.order || a.data.work.localeCompare(b.data.work, 'ja'),
  );
}

export async function getSchoolEntry(id: string): Promise<SchoolEntry | undefined> {
  const resolvedId = resolveSchoolSlug(id);
  try {
    return await getEntry('school', resolvedId);
  } catch {
    return undefined;
  }
}

export function schoolEntrySynopsis(entry: SchoolEntry): string {
  return entry.data.synopsis ?? '';
}
