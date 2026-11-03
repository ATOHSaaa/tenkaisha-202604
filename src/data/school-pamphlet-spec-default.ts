/** 学校公演パンフレット「公演条件」の共通デフォルト（YAML では spec: default） */
export type SchoolPamphletSpecRow = {
  label: string;
  value: string;
  note?: string;
};

export const schoolPamphletSpecDefault = [
  { label: '公演場所', value: '体育館やホールなど、平らな空間' },
  { label: '公演時間', value: '約60分' },
  { label: '設営時間', value: '前日設営をお願いしています' },
  { label: '撤去時間', value: '約3時間' },
  {
    label: '料金',
    value: '20万円（定額・目安）',
    note: '規模・ご予算に合わせてご相談ください。',
  },
] as const satisfies readonly SchoolPamphletSpecRow[];
