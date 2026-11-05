const WIDE_CARD = '.about-figures__card--wide';
const CALLOUT_OVERLAY = '.about-figures__callouts';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** 始点の円。解説側の丸（10px・枠2px）と見た目を揃える */
const START_R = 4;

let resizeObserver: ResizeObserver | null = null;
let scrollTarget: HTMLElement | null = null;
let bound = false;

function calloutEnabled(): boolean {
  return window.matchMedia('(min-width: 801px)').matches;
}

function drawCallouts(): void {
  const card = document.querySelector(WIDE_CARD);
  if (!card) return;

  const overlay = card.querySelector(CALLOUT_OVERLAY) as SVGSVGElement | null;
  const chartSvg = card.querySelector('.about-figures__chart-col .about-figures__svg');
  const notes = card.querySelector('.about-figures__notes');
  if (!overlay || !chartSvg || !notes) return;

  overlay.replaceChildren();
  if (!calloutEnabled()) return;

  const origin = overlay.getBoundingClientRect();
  if (origin.width <= 0 || origin.height <= 0) return;

  overlay.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`);

  const labels = chartSvg.querySelectorAll<SVGTextElement>('text[data-callout-year]');
  const links: { x1: number; y1: number; x2: number; y2: number; endR: number }[] = [];

  for (const label of labels) {
    const year = label.getAttribute('data-callout-year');
    if (!year) continue;
    const target = label.getAttribute('data-callout-target') || year;
    const anchor = card.querySelector<HTMLElement>(
      `.about-figures__note-item[data-callout-year="${target}"] .about-figures__note-anchor`,
    );
    if (!anchor) continue;

    const labelRect = label.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const endR = anchorRect.width / 2;
    links.push({
      x1: labelRect.left + labelRect.width / 2 - origin.left,
      y1: labelRect.bottom - origin.top + 2 + START_R,
      x2: anchorRect.left + endR - origin.left,
      y2: anchorRect.top + endR - origin.top,
      endR,
    });
  }
  if (links.length === 0) return;

  const chartRight = chartSvg.getBoundingClientRect().right - origin.left;
  const chartBottom = chartSvg.getBoundingClientRect().bottom - origin.top;
  const notesLeft = notes.getBoundingClientRect().left - origin.left;
  const spineX = (chartRight + notesLeft) / 2;
  const stemBottom = Math.max(...links.map((link) => link.y1 + START_R + 1));
  const laneY = Math.min(stemBottom + 8, chartBottom - 4);

  for (const link of links) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', calloutPath(link, laneY, spineX));
    path.setAttribute('class', 'about-figures__callout-path');
    overlay.appendChild(path);
  }

  for (const link of links) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(link.x1));
    dot.setAttribute('cy', String(link.y1));
    dot.setAttribute('r', String(START_R));
    dot.setAttribute('class', 'about-figures__callout-dot');
    overlay.appendChild(dot);
  }
}

/** 年号の下から一度下がり、グラフ右の隙間を上がって解説の丸に入る */
function calloutPath(
  link: { x1: number; y1: number; x2: number; y2: number; endR: number },
  laneY: number,
  spineX: number,
): string {
  const sy = link.y1 + START_R + 1;
  const ex = link.x2 - link.endR;
  const down = Math.max(0, laneY - sy);
  const right = Math.max(0, spineX - link.x1);
  const up = Math.max(0, laneY - link.y2);
  const into = Math.max(0, ex - spineX);
  const r = Math.max(0, Math.min(7, down / 2, right / 2, up / 2, into / 2));
  if (r < 1) {
    return `M ${link.x1} ${sy} L ${link.x1} ${laneY} L ${spineX} ${laneY} L ${spineX} ${link.y2} L ${ex} ${link.y2}`;
  }
  return [
    `M ${link.x1} ${sy}`,
    `L ${link.x1} ${laneY - r}`,
    `Q ${link.x1} ${laneY} ${link.x1 + r} ${laneY}`,
    `L ${spineX - r} ${laneY}`,
    `Q ${spineX} ${laneY} ${spineX} ${laneY - r}`,
    `L ${spineX} ${link.y2 + r}`,
    `Q ${spineX} ${link.y2} ${spineX + r} ${link.y2}`,
    `L ${ex} ${link.y2}`,
  ].join(' ');
}

export function initAboutFigureCallouts(): void {
  const card = document.querySelector(WIDE_CARD);
  if (!card) return;

  if (!bound) {
    window.addEventListener('resize', drawCallouts, { passive: true });
    bound = true;
  }

  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', drawCallouts);
    scrollTarget = null;
  }
  scrollTarget = card.querySelector<HTMLElement>('.about-figures__chart-col');
  scrollTarget?.addEventListener('scroll', drawCallouts, { passive: true });

  if (resizeObserver) resizeObserver.disconnect();
  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(drawCallouts);
  });
  resizeObserver.observe(card);

  requestAnimationFrame(() => requestAnimationFrame(drawCallouts));
}
