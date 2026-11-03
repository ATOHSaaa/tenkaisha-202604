/** 学校公演でご案内している主な演目（ページの表はこの配列から生成） */
export type SchoolTargetLevel = '小学生' | '中学生' | '高校生';

export type SchoolPerformancePiece = {
  slug: string;
  /** 演目（作品名。例: 『細川重賢一代記』） */
  work: string;
  /** 概要（体裁・ジャンル。例: 歴史発見ミュージカル） */
  overview: string;
  /** 下層ページのリード文 */
  lead: string;
  targets: SchoolTargetLevel[];
  /** 目安の上演時間（例: 約45分） */
  duration: string;
};

export const schoolTargetOrder: SchoolTargetLevel[] = ['小学生', '中学生', '高校生'];

export const schoolPerformanceRepertoire: SchoolPerformancePiece[] = [
  {
    slug: 'donguri-yamaneko',
    work: '『どんぐりと山猫』',
    overview: '朗読ミュージカル',
    lead:
      '宮沢賢治の名作を、朗読と歌・演奏で届ける学校公演用プログラムです。児童の想像力を広げながら、物語の世界に入り込む構成にしています。',
    targets: ['小学生', '中学生', '高校生'],
    duration: '約60分',
  },
  {
    slug: 'ogawa-unmei',
    work: '『小川未明作品集』',
    overview: '朗読ミュージカル',
    lead:
      '小川未明の短編を素材にした朗読ミュージカル。やさしい語りと音楽で、児童文学の魅力を学校のホールや体育館でお届けします。',
    targets: ['小学生', '中学生', '高校生'],
    duration: '約60分',
  },
  {
    slug: 'hana',
    work: '『鼻』',
    overview: '文学ミュージカル',
    lead:
      '芥川龍之介「鼻」を題材にした文学ミュージカル。読みの時間・音楽・短い演劇シーンを組み合わせ、古典に親しむきっかけをつくります。',
    targets: ['小学生'],
    duration: '約60分',
  },
  {
    slug: 'sarashina-nikki',
    work: '『更級日記』',
    overview: 'エレクトロニック古典ミュージカル',
    lead:
      '平安の女流日記を現代的な音で描くエレクトロニック古典ミュージカル。中高生向けに、古典と現代表現の接点を楽しめる構成です。',
    targets: ['中学生', '高校生'],
    duration: '約100分',
  },
  {
    slug: 'genjo',
    work: '『大唐大慈恩寺玄奘三蔵法師伝』',
    overview: '巡礼ミュージカル',
    lead:
      '玄奘三蔵の旅路を音楽と語りで辿る巡礼ミュージカル。歴史・宗教・人の意志をテーマに、中高生向けの上演時間でお届けします。',
    targets: ['中学生', '高校生'],
    duration: '約100分',
  },
  {
    slug: 'hosokawa-shigetaka',
    work: '『細川重賢一代記』',
    overview: '歴史発見ミュージカル',
    lead:
      '熊本の歴史人物・細川重賢を題材にした歴史発見ミュージカル。郷土の人物を通して、歴史学習の入口となる学校公演プログラムです。',
    targets: ['小学生', '中学生', '高校生'],
    duration: '約60分',
  },
];

export function getSchoolPerformancePiece(slug: string): SchoolPerformancePiece | undefined {
  return schoolPerformanceRepertoire.find((piece) => piece.slug === slug);
}
