import { members, type Member } from '../data/site';

export type { Member };

export function memberHref(slug: string): string {
  return `/members/${slug}/`;
}

export function getMembers(): Member[] {
  return members;
}

export function getMemberBySlug(slug: string): Member | undefined {
  return members.find((m) => m.slug === slug);
}
