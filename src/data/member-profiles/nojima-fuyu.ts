import type { MemberProfile } from '../member-profiles-types';

/** 野島ふゆ — プロフィール（サイト・公演情報より） */
export const nojimaFuyuProfile: MemberProfile = {
  bio: `小学生から老兵、哲学者ソクラテス、江夏豊まで——年齢もキャラクターも越えて役に入り込む実力派俳優。

転回社のロングランミュージカル、オリジナル公演、学校公演など幅広い作品に出演。静と動の落差を活かした存在感で、作品の骨格を支える。

ワークショップや学校鑑賞プログラムにも参加し、子どもから大人まで演劇の入口を広げる活動も行う。`,
  sections: [
    {
      heading: '舞台出演',
      rows: [
        { year: '2015', month: '7', body: '転回社ミュージカル「十二夜」' },
        { year: '2017', month: '12', body: '転回社ロングランミュージカル「ジョン王」' },
        { year: '2019', month: '1', body: '転回社ロングランミュージカル「饗宴」' },
        { year: '2021', month: '6～', body: '転回社ロングランミュージカル「大唐大慈恩寺玄奘三蔵法師伝」' },
        { year: '2024', month: '4', body: '転回社ロングランミュージカル「斎藤道三殺生伝」' },
        { year: '2025', month: '11', body: '転回社ロングランミュージカル「CAPPA!」' },
      ],
      footerNote: 'ほか多数',
    },
    {
      heading: '学校公演・WS',
      rows: [
        { year: '2018', month: '4～', body: '学校公演・鑑賞プロジェクト　出演' },
        { year: '2020', month: '年度', body: '演劇ワークショップ　ゲスト出演・助言' },
      ],
    },
  ],
};
