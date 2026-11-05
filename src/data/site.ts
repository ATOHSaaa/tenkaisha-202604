// サイト共通データ。ページから import して使うこと前提のプレースホルダ。

export type Studio = {
  name: string;
  address: string;
  building: string;
  note?: string;
};

/** 住所から Google マップ検索 URL を生成 */
export function studioMapUrl(studio: Studio): string {
  const query = `${studio.address} ${studio.building}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const studios: Studio[] = [
  {
    name: '転回社スタジオ',
    address: '熊本県熊本市中央区国府1丁目21-3',
    building: 'ブラザービル3階',
    note: '本拠地。稽古場兼小劇場。',
  },
  {
    name: '窓があるスタジオ',
    address: '熊本県熊本市中央区国府1丁目21-10',
    building: '第5梅香園ビル4階',
    note: '採光の良い稽古スペース。',
  },
  {
    name: 'スタジオサザンクロス',
    address: '熊本県熊本市中央区国府1丁目21-2',
    building: '村上ビル2階',
    note: 'ワークショップ・小規模稽古向け。',
  },
];

export type Member = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  /** 顔写真。photoMonogram がある場合は一覧では未使用 */
  photo?: string;
  /** 一覧アイコン（縦書きの姓など） */
  photoMonogram?: string;
  /** 詳細ページ用（幅 560px 以上推奨）。未指定時は photo */
  photoDetail?: string;
};

export const members: Member[] = [
  {
    slug: 'komatsuno-nozomi',
    name: '小松野 希海',
    role: 'プロデューサー / 俳優',
    bio: '',
    photo: '/images/members/komatsuno-nozomi.png',
  },
  {
    slug: 'sakaguchi-kanoko',
    name: '坂口 佳乃子',
    role: '俳優',
    bio: '',
    photo: '/images/members/sakaguchi-kanoko.png',
  },
  {
    slug: 'nojima-fuyu',
    name: '野島 ふゆ',
    role: '俳優',
    bio: '',
    photo: '/images/members/nojima-fuyu.png',
  },
  {
    slug: 'fujino-minami',
    name: '藤野 未波',
    role: '俳優',
    bio: '',
    photo: '/images/members/fujino-minami.png',
  },
  {
    slug: 'kamei-juntaro',
    name: '亀井 純太郎',
    role: '演出家',
    bio: '',
    photoMonogram: '亀井',
  },
  {
    slug: 'oshiyama-shiho',
    name: '鴦山 史歩',
    role: '作家',
    bio: '',
    photoMonogram: '鴦山',
  },
];

export type BannerInfo = {
  title: string;
  href: string;
  english?: string;
};

/** トップページ「ご案内」バナー */
export const homeBanners: BannerInfo[] = [
  {
    title: '演劇と教育',
    english: 'THEATER & EDUCATION',
    href: '/education/',
  },
  {
    title: '劇団員紹介',
    english: 'MEMBERS',
    href: '/members/',
  },
];

export const corporateBanner: BannerInfo = {
  title: '法人の方へ',
  english: 'FOR ORGANIZATIONS',
  href: '/for-organizations/',
};

/** トップ：活動カード直下の友の会案内 */
export type FriendsIntro = {
  /** 見出し全体（アクセシビリティ用） */
  title: string;
  /** 見出し内で下線を引く部分 */
  titleMark: string;
  /** titleMark の後ろの見出し文言 */
  titleRest: string;
  english: string;
  href: string;
  linkLabel: string;
  paragraphs: string[];
  /** 背景写真（カード内・黒ブラー） */
  backgroundImage: string;
};

export const friendsIntro: FriendsIntro = {
  title: '友の会のご案内',
  titleMark: '友の会',
  titleRest: 'のご案内',
  english: 'SUPPORTERS',
  href: '/supporter/',
  linkLabel: '友の会の詳細を見る',
  backgroundImage: '/images/home/friends-intro-bg.png',
  paragraphs: [
    'いつも転回社の活動を応援していただき、誠にありがとうございます。',
    '当団体では、今後も継続的に公演や教育活動を行っていくために、活動を支援してくださる友の会の会員さまを募集しております。',
    '皆さまの応援を頂き、より充実した作品づくりと熊本の文化の発展を目指してまいりますので、何ぞとご協力のほどよろしくお願いいたします。',
  ],
};

export type HomeActivityThumbnail = {
  image: string;
  imageFocus?: 'top' | 'center';
  imagePosition?: string;
  imageScaleDesktop?: number;
};

export type HomeActivity = {
  number: string;
  title: string;
  summary: string;
  href: string;
  linkLabel: string;
  image: string;
  /** サムネイル2枚並置（指定時はこちらを表示） */
  thumbnails?: HomeActivityThumbnail[];
  /** サムネイルの object-position（既定: center） */
  imageFocus?: 'top' | 'center';
  /** imageFocus より優先（例: center 26%） */
  imagePosition?: string;
  /** サムネイル拡大（上端基準、はみ出しはクリップ） */
  imageScale?: number;
  /** PC幅のみ imageScale と同様 */
  imageScaleDesktop?: number;
};

/** トップ：友の会バナー直上の活動カード */
export const homeActivities: HomeActivity[] = [
  {
    number: '01',
    title: '舞台制作',
    summary:
      'オリジナルミュージカルやストレートプレイの企画・制作・公演。熊本を拠点に、継続的な上演と新作づくりを行っています。',
    href: '/stages/',
    linkLabel: '公演・イベント',
    image: '/images/home-hero-alt.jpg',
    imagePosition: 'center 24%',
  },
  {
    number: '02',
    title: '教育活動',
    summary:
      '学校公演、演劇ワークショップ、ジュニアクラスなど。子どもから大人まで、演劇に触れ・学べる場を届けます。',
    href: '/education/',
    linkLabel: '演劇と教育',
    image: '/images/education/school-performance.png',
    imageFocus: 'top',
    imageScaleDesktop: 1.12,
  },
  {
    number: '03',
    title: '外部出演',
    summary:
      '転回社所属の俳優・音楽家が、舞台をはじめメディアや地域のイベントなど、さまざまな場で活動しています。',
    href: '/members/',
    linkLabel: '劇団員紹介',
    image: '/images/members/komatsuno-nozomi.png',
    thumbnails: [
      {
        image: '/images/members/komatsuno-nozomi.png',
        imagePosition: 'center 18%',
      },
      {
        image: '/images/members/sakaguchi-kanoko.png',
        imagePosition: 'center 22%',
      },
    ],
  },
  {
    number: '04',
    title: '外部講師',
    summary:
      '企業・自治体・学校向けに、演劇ワークショップなど、講師・ファシリテーターの派遣を承ります。',
    href: '/for-organizations/',
    linkLabel: '法人の方へ',
    image: '/images/education/school-performance.png',
    imageFocus: 'top',
  },
];

export type EducationProgramCard = {
  title: string;
  english: string;
  summary: string;
  /** 演劇と教育ページのリード下に続く説明 */
  detail?: string;
  image: string;
  path: string;
};

/** 演劇と教育ページのプログラムカード */
export const educationPrograms: EducationProgramCard[] = [
  {
    title: '学校公演',
    english: 'SCHOOL SHOW',
    summary:
      '熊本を中心に、主に小学校〜高校を対象とした学校公演を承ります。体育館・多目的室での上演にも対応可能です。',
    detail:
      '公演後に児童・生徒と交流する時間も設けられます。採択事業や学校の目的に合わせ、演目選びから当日の進行までご相談ください。',
    image: '/images/education/school-performance.png',
    path: '/education/school/',
  },
  {
    title: '演劇ワークショップ',
    english: 'WORKSHOP',
    summary:
      '小・中学校向けの演劇ワークショップを、学級活動や総合的な学習の時間など、学校のご要望に合わせて設計・実施します。',
    detail:
      '転回社は熊本県内を中心に、長年にわたり学校でのワークショップ実績を重ねてきました。事例集の送付や、文化庁の学校向け事業への応募を見据えたご提案も可能です。',
    image: '/images/education/workshop-program.jpg',
    path: '/education/workshop/',
  },
];

/** 依頼詳細コンポーネント用（法人向けプログラム等） */
export type RequestInfo = {
  slug: string;
  name: string;
  english: string;
  summary: string;
  image: string;
  path: string;
};

export type Publication = {
  slug: string;
  title: string;
  subtitle?: string;
  cover: string;
  year: number;
  summary: string;
  path: string;
};

export const publications: Publication[] = [
  {
    slug: 'school-workshop',
    title: '演劇ワークショップ事例集',
    cover: '/images/education/workshop-casebook-cover.jpg',
    year: 2025,
    summary:
      '転回社が熊本県内の学校で行ってきた演劇ワークショップの事例を、記録と合わせてまとめた一冊。',
    path: '/publications/school-workshop/',
  },
];

import { getDefaultContactFormUrl } from './page-contact-cta';

/** Google フォーム URL（page-contact-cta.yaml の default.formUrl） */
export const contactFormUrl = getDefaultContactFormUrl();

export const social = [
  { label: 'X', url: 'https://x.com/' },
  { label: 'Instagram', url: 'https://www.instagram.com/' },
  { label: 'YouTube', url: 'https://www.youtube.com/' },
  { label: 'Facebook', url: 'https://www.facebook.com/' },
];
