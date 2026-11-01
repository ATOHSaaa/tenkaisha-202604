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
  name: string;
  role: string;
  bio: string;
  photo: string;
};

export const members: Member[] = [
  {
    name: '小松野 希海',
    role: 'プロデューサー / 俳優',
    bio: '元劇団四季。2015年より転回社スタジオを主宰。継続的な演劇活動の場を熊本に根づかせる活動を行う。',
    photo: '/images/members/komatsuno-nozomi.png',
  },
  {
    name: '坂口 佳乃子',
    role: '俳優',
    bio: '熊本少年少女合唱団出身。劇団第七インターチェンジ所属。転回社製作のミュージカルには音楽隊のメンバーとして参加している。また、文化庁事業の演劇ワークショップ講師アシスタントとして多数の小中学校で演劇ワークショップを行っている。',
    photo: '/images/members/sakaguchi-kanoko.png',
  },
  {
    name: '野島 ふゆ',
    role: '俳優',
    bio: '小学生、老兵士、哲学書ソクラテス、江夏豊。幅広い役柄を独自の感性で演じきる実力派俳優。',
    photo: '/images/members/nojima-fuyu.png',
  },
  {
    name: '藤野 未波',
    role: '俳優',
    bio: '天草が生んだ元気娘。とぼけた顔で舞台中をパワフルに飛び跳ねる。',
    photo: '/images/members/fujino-minami.png',
  },
];

export type ClassInfo = {
  slug: string;
  name: string;
  english: string;
  tag: string;
  summary: string;
  image: string;
  schedule?: string;
  target?: string;
  fee?: string;
  path: string;
};

export const classes: ClassInfo[] = [
  {
    slug: 'musical-club',
    name: '熊本ミュージカルクラブ',
    english: 'KUMAMOTO MUSICAL CLUB',
    tag: 'ミュージカル',
    summary: '週に一回、国府電停そばのスタジオで楽しくミュージカル活動。元劇団四季・小松野希海と一緒に、ミュージカルの世界を体験してみませんか。',
    image: '/images/mocks/class-musical.svg',
    schedule: '火曜 19:30-21:00',
    target: '年齢制限なし',
    fee: '月額 8,000円',
    path: '/classes/musical-club/',
  },
  {
    slug: 'junior',
    name: '転回社ジュニアクラス',
    english: 'JUNIOR CLASS',
    tag: '小1〜中3',
    summary: '小学1年生〜中学3年生を対象とした、演劇を通じて表現を育てるクラス。',
    image: '/images/mocks/class-junior.svg',
    schedule: '毎週金曜 17:30-19:30',
    target: '小学1年生〜中学3年生',
    fee: '月額 6,000円',
    path: '/classes/junior/',
  },
  {
    slug: 'hassei',
    name: 'くまもと発声表現教室',
    english: 'VOICE EXPRESSION',
    tag: '発声／話し方',
    summary: '演劇の手法を活かした、大人のための発声・表現の教室。',
    image: '/images/mocks/class-hassei.svg',
    schedule: '毎週水曜 19:30-21:00',
    target: '大人（一般）',
    fee: '月額 5,000円',
    path: '/classes/hassei/',
  },
];

/** トップページ「開講クラス」に表示する3クラス */
export const homeClasses: ClassInfo[] = [
  classes.find((c) => c.slug === 'musical-club')!,
  classes.find((c) => c.slug === 'junior')!,
  classes.find((c) => c.slug === 'hassei')!,
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
    href: '/requests/members/',
  },
];

export const corporateBanner: BannerInfo = {
  title: '法人の方向け',
  english: 'FOR ORGANIZATIONS',
  href: '/for-organizations/',
};

/** トップページ「開講クラス」直上の友の会バナー */
export const friendsBanner: BannerInfo = {
  title: '友の会のご案内',
  english: 'SUPPORTERS',
  href: '/supporter/',
};

export type OrganizationProgram = {
  slug: string;
  name: string;
  summary: string;
  image: string;
  path: string;
};

/** 法人の方向けプログラム */
export const organizationPrograms: OrganizationProgram[] = [
  {
    slug: 'workshop',
    name: '演劇ワークショッププログラム',
    summary: '企業・自治体・福祉施設向けに、演劇の手法を活かしたワークショップをご提案します。',
    image: '/images/mocks/request-workshop.svg',
    path: '/for-organizations/workshop/',
  },
  {
    slug: 'training',
    name: '学校の教職員向け研修',
    summary: '授業づくりや学級経営に活かせる、演劇的手法を取り入れた教職員研修です。',
    image: '/images/mocks/request-school.svg',
    path: '/for-organizations/training/',
  },
];

export type RequestInfo = {
  slug: string;
  name: string;
  english: string;
  summary: string;
  image: string;
  path: string;
};

export const requests: RequestInfo[] = [
  {
    slug: 'school',
    name: '学校公演',
    english: 'SCHOOL SHOW',
    summary: '主に小学校を対象とした、学校公演を承ります。',
    image: '/images/mocks/request-school.svg',
    path: '/requests/school/',
  },
  {
    slug: 'workshop',
    name: 'ワークショップ',
    english: 'WORKSHOP',
    summary: '演劇の手法を使った、学校・地域向けワークショップ。',
    image: '/images/mocks/request-workshop.svg',
    path: '/requests/workshop/',
  },
  {
    slug: 'members',
    name: '劇団員紹介',
    english: 'MEMBERS',
    summary: '転回社に所属する俳優・スタッフをご紹介します。',
    image: '/images/mocks/request-members.svg',
    path: '/requests/members/',
  },
];

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
    title: '学校ワークショップ事例集',
    subtitle: 'TENKAISHA PUBLICATIONS VOL.01',
    cover: '/images/publications/school-workshop.svg',
    year: 2025,
    summary:
      '転回社が熊本県内の学校で行ってきた演劇ワークショップの事例を、記録と合わせてまとめた一冊。',
    path: '/publications/school-workshop/',
  },
];

// Google フォームURLなどは後で差し替え可能に一箇所に集約
export const contactFormUrl = 'https://docs.google.com/forms/d/e/XXXXXXX/viewform';

export const social = [
  { label: 'X', url: 'https://x.com/' },
  { label: 'Instagram', url: 'https://www.instagram.com/' },
  { label: 'YouTube', url: 'https://www.youtube.com/' },
  { label: 'Facebook', url: 'https://www.facebook.com/' },
];
