/** 公演・イベントタイトルの作品名括弧を『』に統一 */
export function formatShowTitle(title: string): string {
  return title.replace(/「/g, '『').replace(/」/g, '』');
}

/** 『の直前で折り返し可能にする分割（『がなければ null。表示は wbr で1行のときは改行しない） */
export function splitShowTitleBeforeWork(title: string): { lead: string; work: string } | null {
  const formatted = formatShowTitle(title);
  const index = formatted.indexOf('『');
  if (index <= 0) return null;
  return {
    lead: formatted.slice(0, index),
    work: formatted.slice(index),
  };
}
