import { initTemplateLazyLoad } from './template-lazy-load';

/** /stages/ 「これまで」: スクロールで次の年ブロックを template から追加 */
export function initStagesArchiveLazyLoad(): void {
  initTemplateLazyLoad({
    sentinelSelector: '[data-stages-archive-sentinel]',
    templateSelector: 'template[data-stages-archive-year]',
    defaultAppendSelector: '[data-stages-archive]',
  });
}
