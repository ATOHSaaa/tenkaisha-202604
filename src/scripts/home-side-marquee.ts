/** 1周（トラック高さの半分）あたりのスクロール速度 */
const MARQUEE_PX_PER_SEC = 28;
/** 内側から 1, 3, 5… 列目 */
const ODD_COLUMN_WORD = 'TENKAISHA';
/** 内側から 2, 4, 6… 列目。1周分の並び */
const EVEN_COLUMN_WORDS = [
  'CAPPA!',
  'SAITO-DOSAN-SESSHO-DEN',
  'DAITO-DAIJIONJI-GENJO-SANZO-HOSHI-DEN',
  'SARASHINA-NIKKI',
  'KYOEN',
] as const;

let layoutObserver: ResizeObserver | null = null;
let motionObserver: ResizeObserver | null = null;
let layoutBound = false;
let lifecycleBound = false;
let measureProbe: HTMLDivElement | null = null;
let resyncTimer: ReturnType<typeof setTimeout> | null = null;

function createMarqueeWord(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'home-side-marquee__word';
  span.textContent = text;
  return span;
}

function wordsForColumn(index: number): readonly string[] {
  if (index % 2 === 0) {
    return Array.from({ length: EVEN_COLUMN_WORDS.length }, () => ODD_COLUMN_WORD);
  }
  return EVEN_COLUMN_WORDS;
}

function getMeasureProbe(): HTMLDivElement {
  if (!measureProbe) {
    measureProbe = document.createElement('div');
    measureProbe.className = 'home-side-marquee__columns';
    measureProbe.setAttribute('aria-hidden', 'true');
    measureProbe.style.position = 'fixed';
    measureProbe.style.left = '-9999px';
    measureProbe.style.top = '0';
    measureProbe.style.visibility = 'hidden';
    measureProbe.style.pointerEvents = 'none';
    document.body.appendChild(measureProbe);
  }
  return measureProbe;
}

function measureColumnWidth(): { wordW: number; colGap: number } {
  const probe = getMeasureProbe();
  const col = document.createElement('div');
  col.className = 'home-side-marquee__column';
  col.appendChild(createMarqueeWord(ODD_COLUMN_WORD));
  probe.replaceChildren(col);
  const wordW = col.offsetWidth;
  const colGap = parseFloat(getComputedStyle(probe).columnGap) || 12;
  return { wordW, colGap };
}

function createColumnStack(words: readonly string[]): HTMLDivElement {
  const col = document.createElement('div');
  col.className = 'home-side-marquee__column';
  for (const word of words) {
    col.appendChild(createMarqueeWord(word));
  }
  return col;
}

/**
 * 文言も流れる向きも、メインに近い内側から外側へ数える。
 * 左の内側は上、右の内側は下。列が増えても内側の向きは変えない。
 */
function fillColumns(row: HTMLElement, columnCount: number, innerOnLeft: boolean): void {
  row.replaceChildren();
  for (let c = 0; c < columnCount; c++) {
    const indexFromInner = innerOnLeft ? c : columnCount - 1 - c;
    const down = innerOnLeft ? indexFromInner % 2 === 0 : indexFromInner % 2 === 1;
    const words = wordsForColumn(indexFromInner);
    const track = document.createElement('div');
    track.className = `home-side-marquee__col-track home-side-marquee__col-track--${down ? 'down' : 'up'}`;
    const first = createColumnStack(words);
    const second = createColumnStack(words);
    second.setAttribute('aria-hidden', 'true');
    track.append(first, second);
    row.appendChild(track);
  }
}

function syncSideColumns(side: HTMLElement, force = false): void {
  const row = side.querySelector<HTMLElement>('.home-side-marquee__columns');
  if (!row) return;

  const { wordW, colGap } = measureColumnWidth();
  if (wordW <= 0) return;

  const columnCount = Math.max(1, Math.floor((side.clientWidth + colGap) / (wordW + colGap)));
  const innerOnLeft = side.classList.contains('home-side-marquee--right');
  const signature = `inner-flow:${columnCount}:${innerOnLeft ? 'L' : 'R'}`;
  const hasTracks = row.querySelector('.home-side-marquee__col-track');
  if (!force && row.dataset.columns === signature && hasTracks) return;
  row.dataset.columns = signature;

  fillColumns(row, columnCount, innerOnLeft);
}

function syncMarqueeColumns(force = false): void {
  document.querySelectorAll<HTMLElement>('.home-side-marquee').forEach((side) => {
    syncSideColumns(side, force);
  });
}

function restartMarqueeMotion(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll<HTMLElement>('.home-side-marquee__col-track').forEach((track) => {
    track.style.animation = 'none';
    void track.offsetHeight;
    track.style.removeProperty('animation');
  });
  applyMarqueeDurations();
}

function setMarqueeReadyState(ready: boolean): void {
  const layer = document.querySelector<HTMLElement>('.home-side-marquees');
  if (!layer) return;
  layer.classList.toggle('home-side-marquees--ready', ready);
}

function rightMarqueeHasMotion(): boolean {
  const right = document.querySelector('.home-side-marquee--right');
  if (!right) return false;
  const tracks = right.querySelectorAll('.home-side-marquee__col-track');
  if (tracks.length === 0) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return tracks.length > 0;
  }
  return [...tracks].some((track) => {
    const duration = getComputedStyle(track).animationDuration;
    return duration !== '0s' && duration !== '';
  });
}

function updateMarqueeReadyState(): void {
  const layer = document.querySelector<HTMLElement>('.home-side-marquees');
  if (!layer || layer.hidden) {
    setMarqueeReadyState(false);
    return;
  }
  setMarqueeReadyState(rightMarqueeHasMotion());
}

function syncHomeSideMarqueeLayout(options: { forceColumns?: boolean } = {}): void {
  const home = document.querySelector('.home');
  const guide = document.querySelector('.home-main-guide');
  const layer = document.querySelector<HTMLElement>('.home-side-marquees');
  if (!home || !guide || !layer) return;

  const homeY = home.getBoundingClientRect().top + window.scrollY;
  const guideBottomY = guide.getBoundingClientRect().bottom + window.scrollY;
  const spanTopY = 0;

  const top = spanTopY - homeY;
  const height = guideBottomY - spanTopY;

  if (height <= 48) {
    layer.hidden = true;
    updateMarqueeReadyState();
    return;
  }

  layer.hidden = false;
  layer.style.top = `${top}px`;
  layer.style.height = `${height}px`;

  syncMarqueeColumns(options.forceColumns);
  applyMarqueeDurations();
  restartMarqueeMotion();
  bindMotionObserver();
  updateMarqueeReadyState();
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
  document.querySelectorAll<HTMLElement>('.home-side-marquee__col-track').forEach((track) => {
    applyMarqueeDuration(track);
  });
}

function bindLayoutSync(): void {
  if (layoutBound) return;
  layoutBound = true;
  window.addEventListener('resize', () => syncHomeSideMarqueeLayout(), { passive: true });
}

function bindMotionObserver(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tracks = document.querySelectorAll<HTMLElement>('.home-side-marquee__col-track');
  if (tracks.length === 0) return;

  if (!motionObserver) {
    motionObserver = new ResizeObserver(() => {
      applyMarqueeDurations();
    });
  }

  motionObserver.disconnect();
  tracks.forEach((track) => {
    motionObserver!.observe(track);
  });
}

function bindLayoutObserver(home: Element, guide: Element): void {
  if (!layoutObserver) {
    layoutObserver = new ResizeObserver(() => {
      syncHomeSideMarqueeLayout();
    });
  }
  layoutObserver.disconnect();
  layoutObserver.observe(guide);
  layoutObserver.observe(home);
}

function scheduleDeferredSync(): void {
  if (resyncTimer !== null) clearTimeout(resyncTimer);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncHomeSideMarqueeLayout({ forceColumns: true });
    });
  });
  void document.fonts.ready.then(() => {
    syncHomeSideMarqueeLayout({ forceColumns: true });
  });
  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    syncHomeSideMarqueeLayout({ forceColumns: true });
  }, 120);
}

function teardownHomeSideMarquees(): void {
  layoutObserver?.disconnect();
  motionObserver?.disconnect();
  if (resyncTimer !== null) {
    clearTimeout(resyncTimer);
    resyncTimer = null;
  }
}

function bindHomeSideMarqueeLifecycle(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;

  document.addEventListener('astro:before-preparation', () => {
    if (document.querySelector('.home')) teardownHomeSideMarquees();
  });
}

/** トップ: 左右ガター縦マーキー（ClientRouter で戻ったときも再初期化） */
export function initHomeSideMarquees(): void {
  bindHomeSideMarqueeLifecycle();

  const home = document.querySelector('.home');
  const guide = document.querySelector('.home-main-guide');
  const layer = document.querySelector('.home-side-marquees');
  if (!home || !guide || !layer) return;

  bindLayoutSync();
  setMarqueeReadyState(false);
  document.querySelectorAll<HTMLElement>('.home-side-marquee__columns').forEach((row) => {
    delete row.dataset.columns;
  });

  syncHomeSideMarqueeLayout({ forceColumns: true });
  bindLayoutObserver(home, guide);
  scheduleDeferredSync();
}
