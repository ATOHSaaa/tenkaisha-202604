import { members, type Member } from '../data/site';
import { withBase } from './path';

export type { Member };

export function memberHref(slug: string): string {
  return withBase(`/members/${slug}/`);
}

export function getMembers(): Member[] {
  return members;
}

export function getMemberBySlug(slug: string): Member | undefined {
  return members.find((m) => m.slug === slug);
}

/** 顔写真の代わりに姓モノグラム（HTML または SVG）を円形サムネで表示 */
export function isMemberNameplate(member: Member): boolean {
  return Boolean(member.photoMonogram || member.photo?.endsWith('.svg'));
}
