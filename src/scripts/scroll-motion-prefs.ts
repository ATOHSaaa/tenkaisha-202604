export const SCROLL_MOTION_STORAGE_KEY = 'tenkaisha-scroll-motion';

export type ScrollMotionChoice = 'on' | 'off';

export function getStoredScrollMotion(): ScrollMotionChoice | null {
  try {
    const value = localStorage.getItem(SCROLL_MOTION_STORAGE_KEY);
    return value === 'on' || value === 'off' ? value : null;
  } catch {
    return null;
  }
}

export function applyScrollMotion(on: boolean): void {
  document.documentElement.setAttribute('data-scroll-motion', on ? 'on' : 'off');
}

/** DOM と localStorage を同時に更新 */
export function setStoredScrollMotion(on: boolean): void {
  applyScrollMotion(on);
  try {
    localStorage.setItem(SCROLL_MOTION_STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

export function isUserScrollMotionOn(): boolean {
  return document.documentElement.getAttribute('data-scroll-motion') !== 'off';
}

/** ユーザー設定と OS の reduced-motion を反映 */
export function isScrollMotionEnabled(): boolean {
  if (!isUserScrollMotionOn()) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** localStorage → html[data-scroll-motion]（初回は未保存なら on） */
export function initScrollMotionFromStorage(): void {
  const stored = getStoredScrollMotion();
  applyScrollMotion(stored !== 'off');
}
