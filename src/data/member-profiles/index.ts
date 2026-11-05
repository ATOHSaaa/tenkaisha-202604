import type { MemberProfile, MemberProfileSection } from '../member-profiles-types';
import { fujinoMinamiProfile } from './fujino-minami';
import { kameiJuntaroProfile } from './kamei-juntaro';
import { komatsunoNozomiProfile } from './komatsuno-nozomi';
import { nojimaFuyuProfile } from './nojima-fuyu';
import { oshiyamaShihoProfile } from './oshiyama-shiho';
import { sakaguchiKanokoProfile } from './sakaguchi-kanoko';

const profiles: Partial<Record<string, MemberProfile>> = {
  'fujino-minami': fujinoMinamiProfile,
  'kamei-juntaro': kameiJuntaroProfile,
  'komatsuno-nozomi': komatsunoNozomiProfile,
  'nojima-fuyu': nojimaFuyuProfile,
  'oshiyama-shiho': oshiyamaShihoProfile,
  'sakaguchi-kanoko': sakaguchiKanokoProfile,
};

export function getMemberProfile(slug: string): MemberProfile | undefined {
  return profiles[slug];
}

/** @deprecated getMemberProfile(slug)?.sections を利用 */
export function getMemberProfileSections(slug: string): MemberProfileSection[] | undefined {
  return profiles[slug]?.sections;
}

export type { MemberProfile, MemberProfileSection, MemberProfileRow } from '../member-profiles-types';
