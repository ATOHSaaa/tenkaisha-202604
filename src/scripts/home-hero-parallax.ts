type ParallaxTarget = {
  container: HTMLElement;
  layer: HTMLElement;
  cssVar: string;
  maxShiftRatio: number;
};

let abort: AbortController | null = null;

function updateTarget(target: ParallaxTarget): void {
  const height = target.container.getBoundingClientRect().height || 1;
  const rect = target.container.getBoundingClientRect();
  const maxShift = height * target.maxShiftRatio;
  const viewportH = window.innerHeight;
  const scrollY = window.scrollY;
  const elementTop = rect.top + scrollY;

  // ブロック上端が画面下端に触れる scroll 〜 下端が画面上端を抜ける scroll まで 0→1
  let rangeStart = elementTop - viewportH;
  if (elementTop < viewportH) {
    // ページ読込時から見えているブロックは scroll 0 から（友の会では通常未使用）
    rangeStart = 0;
  }
  const rangeEnd = elementTop + height;
  const travel = rangeEnd - rangeStart;

  if (travel <= 0) {
    target.layer.style.setProperty(target.cssVar, '0px');
    return;
  }

  const progress = Math.max(0, Math.min(1, (scrollY - rangeStart) / travel));
  const y = progress * maxShift;
  target.layer.style.setProperty(target.cssVar, `${y.toFixed(2)}px`);
}

function collectHomeParallaxTargets(): ParallaxTarget[] {
  const targets: ParallaxTarget[] = [];

  const hero = document.querySelector<HTMLElement>('.home-hero');
  const heroSlides = document.querySelector<HTMLElement>('.home-hero__slides');
  if (hero && heroSlides) {
    targets.push({
      container: hero,
      layer: heroSlides,
      cssVar: '--home-hero-scroll-y',
      maxShiftRatio: 0.32,
    });
  }

  const friends = document.querySelector<HTMLElement>('.home-friends');
  const friendsImg = document.querySelector<HTMLElement>('.home-friends__backdrop-img');
  if (friends && friendsImg) {
    targets.push({
      container: friends,
      layer: friendsImg,
      cssVar: '--hero-scroll-y',
      maxShiftRatio: 0.18,
    });
  }

  return targets;
}

export function initHomeHeroParallax(): void {
  abort?.abort();
  abort = new AbortController();
  const { signal } = abort;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll<HTMLElement>('.home-hero__slides').forEach((el) => {
      el.style.setProperty('--home-hero-scroll-y', '0px');
    });
    return;
  }

  const targets = collectHomeParallaxTargets();
  if (targets.length === 0) {
    return;
  }

  let ticking = false;

  const update = () => {
    ticking = false;
    for (const target of targets) {
      updateTarget(target);
    }
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
}
