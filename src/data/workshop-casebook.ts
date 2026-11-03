/** 演劇ワークショップ事例集（刊行物・ワークショップページ共通） */

export const workshopCasebookPath = '/publications/school-workshop/';

export const workshopCasebookCover = '/images/education/workshop-casebook-cover.jpg';

export type WorkshopCasebookTocItem = {
  label: string;
  title?: string;
  /** サイト内リンク（付録など） */
  href?: string;
};

/** 事例集の目次（冊子どおり） */
export const workshopCasebookToc: WorkshopCasebookTocItem[] = [
  {
    label: 'はじめに',
    title: '伝えたい気持ちから始まる学び　演劇と学校教育',
  },
  {
    label: '事例 1',
    title: 'スーツに怯える子どもたちから、スーツが驚く子どもたちに',
  },
  {
    label: '事例 2',
    title: '続けることで生まれた「劇づくりの文化」',
  },
  {
    label: '事例 3',
    title: '集団の中で、一歩踏み出す勇気とは',
  },
  {
    label: '事例 4',
    title: '演劇で紡ぐ、二十三人それぞれの閉校物語',
  },
  {
    label: '事例 5',
    title: '六年間の学びの集大成としての舞台公演',
  },
  {
    label: 'おわりに',
    title: '「表現力」の前にあるもの',
  },
  { label: '参考文献' },
  {
    label: '【付録】',
    title: '演劇ワークショップ 過去の活動実績（2014年度以降分）',
  },
];
