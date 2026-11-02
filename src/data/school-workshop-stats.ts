/** 学校向け演劇ワークショップの集計（校名は公開しない） */

export type SchoolWorkshopYearStat = {
  /** 年度（4月始まり） */
  year: number;
  /** 実施件数（同一校が複数事業に参加した場合は件数としてカウント） */
  sessions: number;
  /** その年度の参加校数（校名の重複を除く） */
  schools: number;
  /** 予定分 */
  planned?: boolean;
};

export const schoolWorkshopYearStats: SchoolWorkshopYearStat[] = [
  { year: 2014, sessions: 8, schools: 8 },
  { year: 2015, sessions: 5, schools: 5 },
  { year: 2016, sessions: 10, schools: 10 },
  { year: 2017, sessions: 7, schools: 6 },
  { year: 2018, sessions: 10, schools: 9 },
  { year: 2019, sessions: 11, schools: 9 },
  { year: 2020, sessions: 11, schools: 10 },
  { year: 2021, sessions: 15, schools: 13 },
  { year: 2022, sessions: 14, schools: 13 },
  { year: 2023, sessions: 10, schools: 10 },
  { year: 2024, sessions: 9, schools: 9 },
  { year: 2025, sessions: 8, schools: 8 },
  { year: 2026, sessions: 11, schools: 11, planned: true },
];

export const schoolWorkshopSummary = {
  firstYear: 2014,
  lastYear: 2026,
  totalSessions: schoolWorkshopYearStats.reduce((n, y) => n + y.sessions, 0),
  /** 2014年度〜現在までに携わった学校数（延べではなく校名の重複を除く） */
  uniqueSchools: 50,
  peakYear: 2021,
  peakSessions: 15,
} as const;
