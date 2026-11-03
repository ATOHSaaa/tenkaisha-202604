/** 1周（トラック高さの半分）あたりのスクロール速度 */
const MARQUEE_PX_PER_SEC = 28;

let layoutObserver: ResizeObserver | null = null;
let motionObserver: ResizeObserver | null = null;
let layoutBound = false;

function syncHomeSideMarqueeLayout(): void {
  const home = document.querySelector('.home');
  const guide = document.querySelector('.home-main-guide');
  const layer = document.querySelector<HTMLElement>('.home-side-marquees');
  if (!home || !guide || !layer) return;

  const homeY = home.getBoundingClientRect().top + window.scrollY;
  const guideBottomY = guide.getBoundingClientRect().bottom + window.scrollY;
  /** ページ最上部（document 上端）から活動帯オレンジ手前まで */
  const spanTopY = 0;

  const top = spanTopY - homeY;
  const height = guideBottomY - spanTopY;

  if (height <= 48) {
    layer.hidden = true;
    return;
  }

  layer.hidden = false;
  layer.style.top = `${top}px`;
  layer.style.height = `${height}px`;
}

function applyMarqueeDuration(track: HTMLElement): void {
  const distance = track.scrollHeight / 2;
  if (distance <= 0) return;
  track.style.setProperty(
    '--home-side-marquee-duration',
    `${distance / MARQUEE_PX_PER_SEC}s`,
  );
}

function applyMarqueeDurations(): void {
  document.querySelectorAll<HTMLElement>('.home-side-marquee__track').forEach((track) => {
    applyMarqueeDuration(track);
  });
}

function bindLayoutSync(): void {
  if (layoutBound) return;
  layoutBound = true;
  window.addEventListener('resize', syncHomeSideMarqueeLayout, { passive: true });
  window.addEventListener('scroll', syncHomeSideMarqueeLayout, { passive: true });
}

export function initHomeSideMarquees(): void {
  const home = document.querySelector('.home');
  const guide = document.querySelector('.home-main-guide');
  const layer = document.querySelector('.home-side-marquees');
  if (!home || !guide || !layer) return;

  bindLayoutSync();
  syncHomeSideMarqueeLayout();

  if (!layoutObserver) {
    layoutObserver = new ResizeObserver(() => {
      syncHomeSideMarqueeLayout();
    });
  }
  layoutObserver.disconnect();
  layoutObserver.observe(guide);
  layoutObserver.observe(home);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tracks = document.querySelectorAll<HTMLElement>('.home-side-marquee__track');
  if (reduced || tracks.length === 0) return;

  if (!motionObserver) {
    motionObserver = new ResizeObserver(() => {
      applyMarqueeDurations();
    });
  }

  motionObserver.disconnect();
  tracks.forEach((track) => {
    motionObserver!.observe(track);
  });
  applyMarqueeDurations();

  void document.fonts.ready.then(() => {
    applyMarqueeDurations();
  });
}
