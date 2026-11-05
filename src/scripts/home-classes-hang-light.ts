/** トップ「開講クラス」— 吊り照明クリックで帯背景色を循環 */

const SECTION_SELECTOR = '.home .section--classes';
const BTN_SELECTOR = '.home-classes-hang-light-btn';

/** 0=緑（CSS 既定）→ 黄 → 橙 → 赤 → 青 → 緑… */
const BG_CYCLE: (string | null)[] = [null, '#e6c229', '#e85c2a', '#d62828', '#3d6db5'];

let boundSection: HTMLElement | null = null;
let abortController: AbortController | null = null;

function readStep(section: HTMLElement): number {
  const raw = section.dataset.homeClassesBgStep;
  if (raw === undefined || raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n < BG_CYCLE.length ? n : 0;
}

function applyStep(section: HTMLElement, step: number): void {
  const color = BG_CYCLE[step];
  if (color === null) {
    section.style.removeProperty('--home-classes-bg');
    delete section.dataset.homeClassesBgStep;
  } else {
    section.style.setProperty('--home-classes-bg', color);
    section.dataset.homeClassesBgStep = String(step);
  }
}

function advance(section: HTMLElement): void {
  const next = (readStep(section) + 1) % BG_CYCLE.length;
  applyStep(section, next);
}

function teardown(): void {
  abortController?.abort();
  abortController = null;
  boundSection = null;
}

export function initHomeClassesHangLight(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) {
    teardown();
    return;
  }

  if (boundSection !== section) {
    teardown();
    boundSection = section;
  }

  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;

  applyStep(section, readStep(section));

  section.querySelectorAll<HTMLButtonElement>(BTN_SELECTOR).forEach((btn) => {
    btn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        advance(section);
      },
      { signal },
    );
  });
}
