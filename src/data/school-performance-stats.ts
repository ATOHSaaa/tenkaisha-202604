/** 学校公演の集計（1公演＝1回としてカウント） */

export type SchoolPerformanceYearStat = {
  /** 年度（4月始まり） */
  year: number;
  /** 当年度の上演回数 */
  performances: number;
  /** 予定分 */
  planned?: boolean;
};

/** 仮データ（後で団内集計の値に差し替え） */
export const schoolPerformanceYearStats: SchoolPerformanceYearStat[] = [
  { year: 2014, performances: 3 },
  { year: 2015, performances: 5 },
  { year: 2016, performances: 6 },
  { year: 2017, performances: 7 },
  { year: 2018, performances: 8 },
  { year: 2019, performances: 10 },
  { year: 2020, performances: 4 },
  { year: 2021, performances: 5 },
  { year: 2022, performances: 8 },
  { year: 2023, performances: 9 },
  { year: 2024, performances: 11 },
  { year: 2025, performances: 10 },
  { year: 2026, performances: 7, planned: true },
];

export const schoolPerformanceSummary = {
  firstYear: 2014,
  lastYear: 2026,
  totalPerformances: schoolPerformanceYearStats.reduce(
    (n, y) => n + y.performances,
    0,
  ),
} as const;
