const HEADING_ID = 'school-repertoire-heading';
const TABLE_SELECTOR = '.school-repertoire';
const TABLE_REVEAL_DELAY = '120ms';

let observer: IntersectionObserver | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function prepare(el: HTMLElement): void {
  el.classList.add('scroll-reveal');
  el.classList.remove('scroll-reveal--visible', 'scroll-reveal--no-motion');
}

function reveal(el: HTMLElement, noMotion = false): void {
  if (noMotion) {
    el.classList.add('scroll-reveal--no-motion');
  }
  el.classList.add('scroll-reveal--visible');
}

function inRevealZone(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return rect.top < vh * 0.92 && rect.bottom > vh * 0.08;
}

function runEnter(heading: HTMLElement, table: HTMLElement, reduced: boolean): void {
  if (reduced) {
    reveal(heading, true);
    reveal(table, true);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reveal(heading);
      reveal(table);
    });
  });
}

/** 学校公演「演目一覧」見出し＋表 — スクロール／ClientRouter 遷移のどちらでも同じフェードイン */
export function initSchoolRepertoireEnter(): void {
  observer?.disconnect();
  observer = null;

  const heading = document.getElementById(HEADING_ID);
  const table = document.querySelector<HTMLElement>(TABLE_SELECTOR);
  if (!heading || !table) return;

  const reduced = prefersReducedMotion();
  prepare(heading);
  prepare(table);
  table.style.setProperty('--reveal-delay', TABLE_REVEAL_DELAY);

  const play = (): void => {
    observer?.disconnect();
    observer = null;
    runEnter(heading, table, reduced);
  };

  if (reduced || inRevealZone(table)) {
    play();
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        play();
      }
    },
    {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12,
    },
  );
  observer.observe(table);
}
