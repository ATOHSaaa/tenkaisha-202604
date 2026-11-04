import { initScrollReveal, rearmScrollRevealAfterMotionOn } from './scroll-reveal';
import { initPageHeaderEyecatchEnter } from './page-header-eyecatch-enter';
import { initHomeSideMarquees } from './home-side-marquee';
import { initHomeNewsMarquee } from './home-news-marquee';
import { initHomeHeroParallax } from './home-hero-parallax';
import { initSchoolRepertoireEnter } from './school-repertoire-enter';
import {
  SCROLL_MOTION_STORAGE_KEY,
  applyScrollMotion,
  getStoredScrollMotion,
  initScrollMotionFromStorage,
  isUserScrollMotionOn,
  setStoredScrollMotion,
} from './scroll-motion-prefs';

export {
  SCROLL_MOTION_STORAGE_KEY,
  applyScrollMotion,
  getStoredScrollMotion,
  initScrollMotionFromStorage,
  isScrollMotionEnabled,
  isUserScrollMotionOn,
  setStoredScrollMotion,
} from './scroll-motion-prefs';

function syncScrollMotionToggleButton(button: HTMLButtonElement): void {
  const on = getStoredScrollMotion() !== 'off';
  applyScrollMotion(on);
  button.setAttribute('aria-checked', String(on));
  button.setAttribute(
    'aria-label',
    on ? 'スクロールアニメーション: オン（クリックでオフ）' : 'スクロールアニメーション: オフ（クリックでオン）',
  );
}

/** 保存値を反映し、トグル見た目を合わせる（ページ遷移後も呼べる） */
export function syncScrollMotionToggleUI(): void {
  initScrollMotionFromStorage();
  const button = document.querySelector<HTMLButtonElement>('[data-scroll-motion-toggle]');
  if (button) syncScrollMotionToggleButton(button);
}

export function refreshScrollMotionDependents(wasOff: boolean): void {
  if (wasOff && isUserScrollMotionOn()) {
    rearmScrollRevealAfterMotionOn();
  }
  initScrollReveal();
  initPageHeaderEyecatchEnter();
  initHomeSideMarquees();
  initHomeNewsMarquee();
  initHomeHeroParallax();
  initSchoolRepertoireEnter();
}

let storageListenerBound = false;

function bindScrollMotionToggle(button: HTMLButtonElement): void {
  button.addEventListener('click', () => {
    const wasOff = !isUserScrollMotionOn();
    setStoredScrollMotion(wasOff);
    syncScrollMotionToggleButton(button);
    refreshScrollMotionDependents(wasOff);
  });
}

export function initScrollMotionToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-scroll-motion-toggle]');
  if (!button) return;

  if (!button.hasAttribute('data-scroll-motion-bound')) {
    button.setAttribute('data-scroll-motion-bound', '');
    bindScrollMotionToggle(button);
  }

  if (!storageListenerBound) {
    storageListenerBound = true;
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== SCROLL_MOTION_STORAGE_KEY) return;
      syncScrollMotionToggleUI();
      refreshScrollMotionDependents(false);
    });
  }

  syncScrollMotionToggleUI();
}
