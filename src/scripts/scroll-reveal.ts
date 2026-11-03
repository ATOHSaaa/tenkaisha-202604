let observer: IntersectionObserver | null = null;
let lastScrollY = 0;
let scrollingDown = true;
let scrollDirectionBound = false;

const STAGGER_SELECTOR =
  '.card, .guide-link, .activity-card, .home-friends, .footer-links__block, .news-list__item, .home .section__actions .badge-btn, .grid-events__more .badge-btn';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function bindScrollDirection(): void {
  if (scrollDirectionBound) return;
  scrollDirectionBound = true;
  lastScrollY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y !== lastScrollY) {
        scrollingDown = y > lastScrollY;
        lastScrollY = y;
      }
    },
    { passive: true },
  );
}

function revealTarget(target: Element): void {
  if (target.classList.contains('scroll-reveal-bg')) {
    target.classList.add('scroll-reveal-bg--visible');
    if (!scrollingDown) {
      target.classList.add('scroll-reveal-bg--no-motion');
    }
    target
      .querySelectorAll('.section-head--scroll-reveal.scroll-reveal:not(.scroll-reveal--visible)')
      .forEach((head) => {
        head.classList.add('scroll-reveal--visible');
        if (!scrollingDown) {
          head.classList.add('scroll-reveal--no-motion');
        }
        observer?.unobserve(head);
      });
    observer?.unobserve(target);
    return;
  }

  target.classList.add('scroll-reveal--visible');
  if (!scrollingDown) {
    target.classList.add('scroll-reveal--no-motion');
  }
  observer?.unobserve(target);
}

function assignStagger(el: Element): void {
  if (!el.matches(STAGGER_SELECTOR)) return;
  const parent = el.parentElement;
  if (!parent) return;

  const siblings = [...parent.children].filter((child) => child.matches(STAGGER_SELECTOR));
  const index = siblings.indexOf(el);
  if (index > 0) {
    (el as HTMLElement).style.setProperty('--reveal-delay', `${index * 75}ms`);
  }
}

function collectRevealTargets(main: HTMLElement): Element[] {
  const targets: Element[] = [];

  main.querySelectorAll(`${STAGGER_SELECTOR}:not([data-scroll-reveal])`).forEach((el) => {
    targets.push(el);
  });

  main.querySelectorAll('h2:not([data-scroll-reveal])').forEach((el) => {
    if (el.closest('.footer-links__block')) return;
    if (el.closest('.section--home-activities')) return;
    if (el.closest('.section--classes')) return;
    if (el.closest('.edu-program')) return;
    if (el.closest('.edu-block')) return;
    targets.push(el);
  });

  main.querySelectorAll('.section-head--scroll-reveal:not([data-scroll-reveal])').forEach((el) => {
    targets.push(el);
  });

  return targets;
}

function shouldSkipScrollRevealObserve(el: Element): boolean {
  return (
    el.classList.contains('section-head--scroll-reveal') &&
    Boolean(el.closest('.scroll-reveal-bg'))
  );
}

/** main 内の見出し・カード等にスクロール表示（astro:page-load でも再実行） */
export function initScrollReveal(): void {
  if (document.body.dataset.scrollReveal === 'off') {
    observer?.disconnect();
    observer = null;
    document
      .getElementById('main')
      ?.querySelectorAll('.scroll-reveal-bg')
      .forEach((el) => el.classList.add('scroll-reveal-bg--visible'));
    document.getElementById('main')?.querySelectorAll('.section-head--scroll-reveal').forEach((el) => {
      el.classList.add('scroll-reveal', 'scroll-reveal--visible');
    });
    return;
  }

  bindScrollDirection();
  lastScrollY = window.scrollY;
  scrollingDown = true;

  const main = document.getElementById('main');
  if (!main) return;

  const reduced = prefersReducedMotion();

  collectRevealTargets(main).forEach((el) => {
    el.setAttribute('data-scroll-reveal', '');
    el.classList.add('scroll-reveal');
    assignStagger(el);
    if (reduced) {
      el.classList.add('scroll-reveal--visible');
    }
  });

  main.querySelectorAll('.scroll-reveal-bg:not([data-scroll-reveal-bg])').forEach((el) => {
    el.setAttribute('data-scroll-reveal-bg', '');
    if (reduced) {
      el.classList.add('scroll-reveal-bg--visible');
    }
  });

  if (reduced) {
    observer?.disconnect();
    observer = null;
    return;
  }

  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealTarget(entry.target);
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12,
    },
  );

  main.querySelectorAll('.scroll-reveal:not(.scroll-reveal--visible)').forEach((el) => {
    if (shouldSkipScrollRevealObserve(el)) return;
    observer?.observe(el);
  });

  main.querySelectorAll('.scroll-reveal-bg:not(.scroll-reveal-bg--visible)').forEach((el) => {
    observer?.observe(el);
  });
}
