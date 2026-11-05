const HEADING_ID = 'school-repertoire-heading';
const TABLE_SELECTOR = '.school-repertoire';
const CARDS_SELECTOR = '.school-repertoire-cards';
const SHELL_SELECTOR = '[data-school-repertoire-shell]';
const TABLE_REVEAL_DELAY = '120ms';
const CARDS_REVEAL_DELAY = '80ms';

let observer: IntersectionObserver | null = null;

import { isScrollMotionEnabled } from './scroll-motion-prefs';

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

function runEnter(heading: HTMLElement, targets: HTMLElement[], reduced: boolean): void {
  if (reduced) {
    reveal(heading, true);
    for (const target of targets) {
      reveal(target, true);
    }
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      reveal(heading);
      for (const target of targets) {
        reveal(target);
      }
    });
  });
}

/** 学校公演「演目一覧」見出し＋表 — スクロール／ClientRouter 遷移のどちらでも同じフェードイン */
export function initSchoolRepertoireEnter(): void {
  observer?.disconnect();
  observer = null;

  const heading = document.getElementById(HEADING_ID);
  const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR);
  const table = document.querySelector<HTMLElement>(TABLE_SELECTOR);
  const cards = document.querySelector<HTMLElement>(CARDS_SELECTOR);
  if (!heading || !shell) return;

  const targets = [cards, table].filter((el): el is HTMLElement => Boolean(el));
  if (targets.length === 0) return;

  const reduced = !isScrollMotionEnabled();
  prepare(heading);
  for (const target of targets) {
    prepare(target);
  }
  if (table) {
    table.style.setProperty('--reveal-delay', TABLE_REVEAL_DELAY);
  }
  if (cards) {
    cards.style.setProperty('--reveal-delay', CARDS_REVEAL_DELAY);
  }

  const play = (): void => {
    observer?.disconnect();
    observer = null;
    runEnter(heading, targets, reduced);
  };

  if (reduced || inRevealZone(shell)) {
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
  observer.observe(shell);
}

function initSchoolRepertoireScrollAffordance(shell: HTMLElement, scrollEl: HTMLElement): void {
  const sync = (): void => {
    const tableView = shell.querySelector<HTMLElement>('.school-repertoire-table-view');
    if (!tableView || getComputedStyle(tableView).display === 'none') {
      shell.classList.remove(
        'school-repertoire-shell--scrollable',
        'school-repertoire-shell--at-start',
        'school-repertoire-shell--at-end',
      );
      return;
    }

    const canScroll = scrollEl.scrollWidth > scrollEl.clientWidth + 1;
    shell.classList.toggle('school-repertoire-shell--scrollable', canScroll);
    if (!canScroll) {
      shell.classList.remove('school-repertoire-shell--at-start', 'school-repertoire-shell--at-end');
      return;
    }
    const atStart = scrollEl.scrollLeft <= 1;
    const atEnd = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - 1;
    shell.classList.toggle('school-repertoire-shell--at-start', atStart);
    shell.classList.toggle('school-repertoire-shell--at-end', atEnd);
  };

  sync();
  scrollEl.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(sync);
    ro.observe(scrollEl);
    ro.observe(scrollEl.firstElementChild ?? scrollEl);
  }
}

export function initSchoolRepertoireScrollShell(): void {
  const shell = document.querySelector<HTMLElement>(SHELL_SELECTOR);
  const scrollEl = shell?.querySelector<HTMLElement>(TABLE_SELECTOR);
  if (!shell || !scrollEl) return;
  initSchoolRepertoireScrollAffordance(shell, scrollEl);
}
