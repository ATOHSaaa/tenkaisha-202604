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

/** 詳細ページ縦書き肩書き用（／の前後スペースなしで分割） */
export function splitMemberDetailRole(role: string): readonly string[] {
  const parts = role
    .trim()
    .split(/\s*[／/]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [role.trim()];
}

/** 詳細ページ縦書き名前用（姓・名の間にスペース1つ） */
export function splitMemberDisplayName(name: string): readonly [string, string] | readonly [string] {
  const trimmed = name.trim();
  const space = trimmed.indexOf(' ');
  if (space === -1) return [trimmed];
  const given = trimmed.slice(space + 1).trim();
  if (!given) return [trimmed];
  return [trimmed.slice(0, space), given];
}
