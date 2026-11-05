import type { MemberProfile } from '../member-profiles-types';

/** 鴦山史歩 — プロフィール（サイト・公演情報より） */
export const oshiyamaShihoProfile: MemberProfile = {
  bio: `「2015 くまもと高校生演劇祭」で脚本・演出・出演の三面から入賞。最優秀賞・脚本賞を受賞した。

2016年、演劇ユニット「おしどりスープ」を結成。転回社の公演では脚本・構成を担当し、朗読劇からミュージカルまで物語の骨格づくりを手がける。

若手からベテランまでが息の合う台詞を生むため、登場人物の「言い切る理由」を丁寧に設計する。`,
  sections: [
    {
      heading: '脚本・構成',
      rows: [
        { year: '2015', month: '10', body: 'くまもと高校生演劇祭　入選作脚本・演出' },
        { year: '2016', month: '3', body: '演劇ユニット「おしどりスープ」　結成・代表' },
        { year: '2018', month: '6', body: '転回社オリジナル公演　脚本' },
        { year: '2022', month: '2', body: '朗読ミュージカル　構成・台詞' },
      ],
      footerNote: 'ほか多数',
    },
    {
      heading: '舞台出演',
      rows: [
        { year: '2015', month: '10', body: 'くまもと高校生演劇祭　上演作品に出演' },
        { year: '2019', month: '5', body: 'おしどりスープ公演「カモメの飛ぶ方向」' },
        { year: '2021', month: '9', body: '転回社製作　朗読シリーズ出演' },
      ],
    },
  ],
};
