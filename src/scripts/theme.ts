const STORAGE_KEY = 'tenkaisha-theme';

/** false の間は常にライト表示（CSS・切替 UI は残す） */
export const THEME_USER_CHOICE_ENABLED = false;

export type ThemeChoice = 'light' | 'dark';

export function getStoredTheme(): ThemeChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function resolveTheme(stored: ThemeChoice | null): ThemeChoice {
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeChoice): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function initTheme(): void {
  if (!THEME_USER_CHOICE_ENABLED) {
    applyTheme('light');
    return;
  }
  applyTheme(resolveTheme(getStoredTheme()));
}

export function initThemeToggle(): void {
  if (!THEME_USER_CHOICE_ENABLED) return;
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button || button.hasAttribute('data-theme-bound')) return;
  button.setAttribute('data-theme-bound', '');

  const syncButton = (): void => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute(
      'aria-label',
      isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え',
    );
  };

  syncButton();

  button.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next: ThemeChoice = isDark ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    syncButton();
  });
}
