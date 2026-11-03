const DEFAULT_ROOT_MARGIN = '320px 0px 0px';

let observer: IntersectionObserver | null = null;

export type TemplateLazyLoadOptions = {
  sentinelSelector?: string;
  templateSelector?: string;
  defaultAppendSelector?: string;
  rootMargin?: string;
  onAfterAppend?: () => void;
};

/** template を順に DOM へ追加（画像は追加まで読み込まれない） */
export function initTemplateLazyLoad(options: TemplateLazyLoadOptions = {}): void {
  observer?.disconnect();
  observer = null;

  const sentinelSelector = options.sentinelSelector ?? '[data-lazy-sentinel]';
  const templateSelector = options.templateSelector ?? 'template[data-lazy-chunk]';
  const defaultAppendSelector = options.defaultAppendSelector ?? '[data-lazy-append]';
  const rootMargin = options.rootMargin ?? DEFAULT_ROOT_MARGIN;

  const sentinel = document.querySelector<HTMLElement>(sentinelSelector);
  if (!sentinel) return;

  const templates = [...document.querySelectorAll<HTMLTemplateElement>(templateSelector)];
  if (templates.length === 0) {
    sentinel.remove();
    return;
  }

  let busy = false;

  const appendNext = (): void => {
    if (busy || templates.length === 0) return;
    busy = true;

    const tpl = templates.shift();
    if (!tpl?.content.firstElementChild) {
      busy = false;
      if (templates.length > 0) appendNext();
      return;
    }

    const targetSelector = tpl.dataset.lazyTarget ?? defaultAppendSelector;
    const root = document.querySelector(targetSelector);
    if (!root) {
      busy = false;
      return;
    }

    root.appendChild(tpl.content.cloneNode(true));
    tpl.remove();
    options.onAfterAppend?.();
    busy = false;

    if (templates.length === 0) {
      observer?.disconnect();
      observer = null;
      sentinel.remove();
    }
  };

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      appendNext();
    },
    { rootMargin },
  );

  observer.observe(sentinel);
}
