/** 公演・学校公演などで共通する人物（表示名＋紹介文） */

export type Person = {
  id: string;
  name: string;
  bio: string;
};

export const people = [
  {
    id: "ishida-miya",
    name: "石田みや",
    bio: "熊本県立大学在学中に書いた戯曲「メランコリーの予感」が県芸術文化祭オープニングステージ作品選考会で最優秀賞となり、県立劇場で上演された。2011年、演劇ユニット「馬車馬の会」結成。2013年〜2018年テント劇団「どくんご」の全国ツアーメンバー。",
  },
  {
    id: "oshiyama-shiho",
    name: "鴦山史歩",
    bio: "「2015 くまもと高校生演劇祭」において多数の応募作品から2本が入賞。上演審査では演出・出演をつとめ、最優秀賞・脚本賞を受賞。2016年3月に演劇ユニット「おしどりスープ」を結成。",
  },
  {
    id: "kamei-juntaro",
    name: "亀井純太郎",
    bio: "2001年、劇団第七インターチェンジを旗揚げ。2015年に芸術性及び実験性の高い作品を継続して発信できる場としてstudio in.K.を設立。近年は小中学校の演劇ワークショップを、熊本県を中心に年間数百回実施。",
  },
  {
    id: "komatsuno-nozomi",
    name: "小松野希海",
    bio: "熊本大学卒業後、「劇団四季」に入団。ライオンキング、赤毛のアンなどに出演。長年の夢であった熊本でのミュージカルのためstudio in.K.を立ち上げた。KKT熊本県民テレビ「てれビタ」レギュラー出演。",
  },
  {
    id: "iwakiri-maiko",
    name: "岩切舞子",
    bio: "転回社ミュージカル公演ではメインピアニストを務め、作曲・編曲も担当。現在、NHK熊本児童合唱団、コールからたち、コール・カタパルトピアニスト。熊本県立湧心館高校非常勤講師。",
  },
] as const satisfies readonly Person[];

export type PersonId = (typeof people)[number]["id"];

const peopleById = new Map<string, Person>(
  people.map((person) => [person.id, person]),
);

export function getPerson(id: string): Person | undefined {
  return peopleById.get(id);
}

export function getPersonOrThrow(id: string): Person {
  const person = getPerson(id);
  if (!person) {
    throw new Error(`Unknown person id: ${id}`);
  }
  return person;
}

export type PersonCredit = Pick<Person, "name" | "bio">;

export function resolvePersonCredits(ids: readonly string[]): PersonCredit[] {
  return ids.map((id) => {
    const { name, bio } = getPersonOrThrow(id);
    return { name, bio };
  });
}
