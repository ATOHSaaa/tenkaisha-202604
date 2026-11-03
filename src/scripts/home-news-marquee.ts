/** 1周（トラック幅の半分）あたりのスクロール速度 */
const MARQUEE_PX_PER_SEC = 20;

let resizeObserver: ResizeObserver | null = null;

function applyMarqueeDuration(track: HTMLElement): void {
  const distance = track.scrollWidth / 2;
  if (distance <= 0) return;
  const durationSec = distance / MARQUEE_PX_PER_SEC;
  track.style.setProperty('--home-news-marquee-duration', `${durationSec}s`);
}

export function initHomeNewsMarquee(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tracks = document.querySelectorAll<HTMLElement>('.home-news-marquee__track');
  if (tracks.length === 0) return;

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          applyMarqueeDuration(entry.target);
        }
      }
    });
  }

  resizeObserver.disconnect();

  tracks.forEach((track) => {
    applyMarqueeDuration(track);
    resizeObserver!.observe(track);
  });

  void document.fonts.ready.then(() => {
    tracks.forEach((track) => applyMarqueeDuration(track));
  });
}
