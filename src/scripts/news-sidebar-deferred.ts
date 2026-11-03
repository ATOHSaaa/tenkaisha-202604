const DESKTOP_MQ = '(min-width: 901px)';

/** おしらせページ: 公演サイドバーを後から差し込み（一覧の表示を優先） */
export function initNewsSidebarDeferred(): void {
  const root = document.querySelector<HTMLElement>('[data-news-sidebar-root]');
  const tpl = document.querySelector<HTMLTemplateElement>('template[data-news-sidebar]');
  if (!root || !tpl) return;

  if (root.dataset.sidebarReady === 'true') return;

  if (!window.matchMedia(DESKTOP_MQ).matches) {
    root.remove();
    tpl.remove();
    return;
  }

  const mount = (): void => {
    if (root.dataset.sidebarReady === 'true') return;
    const fragment = tpl.content.cloneNode(true);
    if (!(fragment instanceof DocumentFragment) || !fragment.firstElementChild) return;
    root.replaceChildren(fragment);
    root.dataset.sidebarReady = 'true';
    root.removeAttribute('aria-busy');
    tpl.remove();
  };

  root.setAttribute('aria-busy', 'true');

  if ('requestIdleCallback' in window) {
    requestIdleCallback(mount, { timeout: 600 });
  } else {
    window.setTimeout(mount, 120);
  }
}
