import { isScrollMotionEnabled } from './scroll-motion-prefs';

function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    return [...seg.segment(text)].map((part) => part.segment);
  }
  return [...text];
}

function collectEyecatchParagraph(eyecatch: HTMLElement): HTMLParagraphElement | null {
  if (eyecatch instanceof HTMLParagraphElement) return eyecatch;
  return eyecatch.querySelector('p');
}

/** マークアップ（ひらがな span 等）を保ったまま 1 文字ずつ span に分割 */
function splitEyecatchChars(eyecatch: HTMLElement): HTMLParagraphElement | null {
  const p = collectEyecatchParagraph(eyecatch);
  if (!p) return null;

  if (p.dataset.eyecatchSplit === 'true') {
    return p;
  }

  const segments: { char: string; hira: boolean }[] = [];

  p.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const char of segmentGraphemes(node.textContent ?? '')) {
        segments.push({ char, hira: false });
      }
      return;
    }
    if (node instanceof HTMLElement) {
      const hira = node.classList.contains('page-header__eyecatch-hira');
      for (const char of segmentGraphemes(node.textContent ?? '')) {
        segments.push({ char, hira });
      }
    }
  });

  const label = segments.map((s) => s.char).join('');
  p.setAttribute('aria-label', label);

  p.replaceChildren(
    ...segments.map((segment, index) => {
      const span = document.createElement('span');
      span.className = 'page-header__eyecatch-char';
      if (segment.hira) span.classList.add('page-header__eyecatch-hira');
      span.style.setProperty('--eyecatch-i', String(index));
      span.textContent = segment.char;
      span.setAttribute('aria-hidden', 'true');
      return span;
    }),
  );

  p.dataset.eyecatchSplit = 'true';
  return p;
}

function playEyecatchEnter(eyecatch: HTMLElement): void {
  const chars = eyecatch.querySelectorAll<HTMLElement>('.page-header__eyecatch-char');
  eyecatch.classList.remove('page-header__eyecatch--enter');
  chars.forEach((char) => {
    char.classList.remove('page-header__eyecatch-char--enter');
    char.style.animation = 'none';
    void char.offsetWidth;
    char.style.removeProperty('animation');
  });
  void eyecatch.offsetWidth;
  eyecatch.classList.add('page-header__eyecatch--enter');
  chars.forEach((char) => char.classList.add('page-header__eyecatch-char--enter'));
}

/** PageHeader のアイキャッチ（例: 地域に演劇を）を 1 文字ずつ下からフェードイン */
export function initPageHeaderEyecatchEnter(): void {
  const targets = document.querySelectorAll<HTMLElement>('.page-header__eyecatch');
  if (targets.length === 0) return;

  const reduced = !isScrollMotionEnabled();

  targets.forEach((eyecatch) => {
    const p = splitEyecatchChars(eyecatch);
    if (!p) return;

    eyecatch.classList.add('page-header__eyecatch--ready');

    if (reduced) {
      eyecatch.classList.add('page-header__eyecatch--enter');
      p.querySelectorAll('.page-header__eyecatch-char').forEach((char) => {
        char.classList.add('page-header__eyecatch-char--enter');
      });
      return;
    }

    playEyecatchEnter(eyecatch);
  });
}
