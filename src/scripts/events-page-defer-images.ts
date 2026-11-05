let observer: IntersectionObserver | null = null;

function loadDeferredImage(img: HTMLImageElement): void {
  const src = img.getAttribute('data-defer-src');
  if (!src || img.hasAttribute('data-defer-loaded')) return;

  img.setAttribute('data-defer-loaded', '');
  img.removeAttribute('data-defer-src');
  img.src = src;
  img.addEventListener(
    'load',
    () => {
      window.dispatchEvent(new Event('resize'));
    },
    { once: true },
  );
}

/** 公演一覧: チラシ DOM は先に出し、画像 URL だけ近づいたら取得 */
export function initEventsPageDeferImages(): void {
  observer?.disconnect();
  observer = null;

  const root = document.querySelector('.events-page');
  if (!root) return;

  const pending = [
    ...root.querySelectorAll<HTMLImageElement>('img[data-defer-src]:not([data-defer-loaded])'),
  ];
  if (pending.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (!(img instanceof HTMLImageElement)) return;
        loadDeferredImage(img);
        observer?.unobserve(img);
      });
    },
    { rootMargin: '480px 0px 480px 0px', threshold: 0.01 },
  );

  pending.forEach((img) => observer?.observe(img));
}
