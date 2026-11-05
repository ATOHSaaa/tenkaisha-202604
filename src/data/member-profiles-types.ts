export type MemberProfileRow = {
  year: string;
  /** 月（数字）、「7～」、「年度」など */
  month: string;
  body: string;
  /** 外部リンク（linkText が body 内にあるときその部分だけリンク） */
  href?: string;
  linkText?: string;
};

export type MemberProfileSection = {
  heading: string;
  rows: MemberProfileRow[];
  /** リスト末尾（右寄せなど）の補足 */
  footerNote?: string;
};

/** 詳細ページ用（紹介文 + 経歴セクション） */
export type MemberProfile = {
  /** 紹介文（段落の区切りは改行 `\n` またはテンプレートリテラル内の実改行） */
  bio: string;
  /** 写真直下の縦書きキャッチ（任意） */
  photoCatchcopy?: string;
  sections: MemberProfileSection[];
};
