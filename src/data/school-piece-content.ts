import type { PersonId } from './people';

export type SchoolSourceCredit = {
  label?: string;
  name: string;
};

export type SchoolSpecRow = {
  label: string;
  value: string;
  note?: string;
};

export type SchoolPamphletContent = {
  script: PersonId[];
  direction: PersonId[];
  cast: PersonId[];
  castNote?: string;
  music: PersonId[];
  headcount: string;
  spec: SchoolSpecRow[];
  recordIntro?: string;
  recordItems?: string[];
  appreciationTitle: string;
  appreciationParagraphs: string[];
};

export type SchoolPieceExtra = {
  sourceCredit?: SchoolSourceCredit;
  synopsis: string;
  pamphlet: SchoolPamphletContent;
};

export const schoolPieceExtras: Partial<Record<string, SchoolPieceExtra>> = {
  'donguri-yamaneko': {
    sourceCredit: { name: '宮沢賢治' },
    synopsis:
      '差出人が「山ねこ」の不思議な手紙を受け取った一郎。森を抜けて山ねこへ会いに行くと、誰が一番えらいどんぐりかを決める裁判に立ち会うことになります。めいめいに自分が一番えらいと言うどんぐりたち。一郎はいったい、どうやってこの場を鎮めるのか……？',
    pamphlet: {
      script: ['ishida-miya', 'oshiyama-shiho'],
      direction: ['kamei-juntaro'],
      cast: ['komatsuno-nozomi'],
      castNote:
        '※ほか、転回社 studio in.K. の俳優が出演します（公演によりキャスト構成は異なります）。',
      music: ['iwakiri-maiko'],
      headcount: '約8名',
      spec: [
        { label: '公演場所', value: '体育館やホールなど、平らな空間' },
        { label: '公演時間', value: '約60分' },
        { label: '設営時間', value: '前日設営をお願いしています' },
        { label: '撤去時間', value: '約3時間' },
        {
          label: '料金',
          value: '20万円（定額・目安）',
          note: '規模・ご予算に合わせてご相談ください。',
        },
      ],
      recordIntro: '熊本県内の小・中学校、高等学校、公民館等で上演してきた実績の一部です。',
      recordItems: [
        '熊本県立熊本西高等学校（2017年）',
        '熊本県立第一高等学校（2018年）',
        '熊本県立乙勢小学校（2019年）',
        '熊本市立城東小学校（2019年）',
        '合志市立万丁東小学校（2019年・2020年）',
        '平成29年度 文部科学省「舞台芸術等総合支援事業・アウトリーチ事業（熊本）」参加（「ものの本物に触れて感性を育む授業をつくる」）',
      ],
      appreciationTitle: '鑑賞の手引き',
      appreciationParagraphs: [
        '「銀河鉄道の夜」や「注文の多い料理店」など、今もなお語り継がれる童話を数多く残した宮沢賢治。その傑作のひとつ「どんぐりと山猫」を、オリジナルの歌曲とともにお届けするのが、本公演の朗読ミュージカルです。',
        '病気のイボスケが、山猫のもとへどんぐりを届ける旅——。やさしい語りと生の演奏、そして歌が重なり、児童・生徒が物語の世界に入り込めるよう構成しています。読み聞かせだけでなく、音楽劇として楽しめる入口にもなります。',
        '鑑賞の前後に、作品の背景や登場人物について短くお話しすることも可能です。学年や授業のテーマに合わせたご相談も承ります。',
      ],
    },
  },
};

export function getSchoolPieceExtra(slug: string): SchoolPieceExtra | undefined {
  return schoolPieceExtras[slug];
}
