import type { MemberProfile } from '../member-profiles-types';

/** 亀井純太郎 — プロフィール（サイト・公演情報より） */
export const kameiJuntaroProfile: MemberProfile = {
  bio: `2001年、劇団第七インターチェンジを旗揚げ。演劇の実験と普及の両面から活動を続けてきた。

2015年、studio in.K.を設立。転回社スタジオを拠点に、小劇場公演の制作・演出に加え、小中学校を中心とした演劇ワークショップを熊本県内外で年間数百回実施している。

「演劇は特別な人のものではない」という信念のもと、参加者の主体性を引き出す進行を得意とする。`,
  sections: [
    {
      heading: '演出・制作',
      rows: [
        { year: '2001', month: '～', body: '劇団第七インターチェンジ　代表・演出' },
        { year: '2015', month: '4', body: 'studio in.K.　設立・主宰' },
        { year: '2017', month: '3', body: '転回社関連公演　演出' },
        { year: '2020', month: '11', body: 'オリジナル公演　脚本・演出' },
      ],
      footerNote: 'ほか多数',
    },
    {
      heading: '教育・ワークショップ',
      rows: [
        { year: '2010', month: '4～', body: '小中高等学校　演劇ワークショップ（熊本県内外）' },
        { year: '2016', month: '9～', body: '文化庁事業・出前アーティスト　講師' },
        { year: '2019', month: '4～', body: '企業・自治体向けコミュニケーション研修　ファシリテーター' },
      ],
    },
  ],
};
