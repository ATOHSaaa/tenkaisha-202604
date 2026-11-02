/** 一覧・詳細ヘッダー等の表示用タイトル（Vol 表記除去・括弧統一） */
const PRODUCE_VOL_PREFIX = /^\s*転回社プロデュース\s*[Vv][Oo][Ll]\.\s*\d+\s*/u;

export function formatShowTitle(title: string): string {
  const stripped = title.replace(PRODUCE_VOL_PREFIX, '').trimStart();
  return stripped.replace(/「/g, '『').replace(/」/g, '』');
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
