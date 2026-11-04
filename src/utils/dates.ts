import { resolveNextPerformanceDate, type PerformanceHistoryItem } from './performance-history';

export const fmtDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

export type NextPerformanceSlot = {
  date: Date;
  time?: string;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 次回公演スロットの表示（例: 9月12日（土） 19:00） */
export function formatNextPerformanceSlot({ date, time }: NextPerformanceSlot): string {
  const weekday = WEEKDAYS[date.getDay()];
  const label = `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`;
  return time ? `${label} ${time}` : label;
}

/** 複数の次回公演を表示（例: 9月12日（土） 19:00、9月20日（日） 19:00） */
export function formatNextPerformanceSchedule(slots: NextPerformanceSlot[]): string {
  return slots.map(formatNextPerformanceSlot).join('、');
}

type ScheduleInput = {
  performanceHistory?: PerformanceHistoryItem[];
};

/** カード等に表示する公演日付ラベル（次回が無いときのフォールバック） */
export function performanceDateLabel(schedule: ScheduleInput): string {
  const next = resolveNextPerformanceDate(schedule);
  return next ? `次回 ${fmtDate(next)}` : '';
}

/** イベントカード等に表示する日付（次回＝直近の未来日） */
export function eventScheduleLabel(schedule: ScheduleInput): string {
  const next = resolveNextPerformanceDate(schedule);
  return next ? fmtDate(next) : '';
}

/** 公演詳細ページの日付表示 */
export function performancePeriodLabel(schedule: ScheduleInput): string {
  const next = resolveNextPerformanceDate(schedule);
  return next ? `次回 ${fmtDate(next)}` : '';
}
