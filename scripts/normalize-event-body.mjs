/**
 * 公演 Markdown 本文を CAPPA / 道三ページと同じ書き方に揃える。
 * scripts/apply-normalize-event-bodies.mjs と wp-import から利用。
 */

const HEADING_MAP = {
  チケット取り扱い: 'チケット取り扱い',
  場所: '場所',
  会場: '場所',
  日時: '日時',
  上演予定: '上演予定',
  料金: '料金',
  チケット: '料金',
  お問い合わせ: 'お問い合わせ',
  出演: '出演',
  出演者: '出演',
};

function normalizeParens(s) {
  return s.replace(/（/g, '(').replace(/）/g, ')');
}

function formatYen(part) {
  return part.replace(/(\d+)円/g, (_, n) => `${Number(n).toLocaleString('ja-JP')}円`);
}

export function normalizeHeading(line) {
  let t = line.replace(/^#{2,3}\s+/, '').replace(/^■+\s*/, '').trim();
  for (const [key, val] of Object.entries(HEADING_MAP)) {
    if (t === key) return `## ${val}`;
  }
  for (const [key, val] of Object.entries(HEADING_MAP)) {
    if (key.length >= 2 && (t.startsWith(`${key}：`) || t.startsWith(`${key}:`))) {
      return `## ${val}`;
    }
  }
  for (const [key, val] of Object.entries(HEADING_MAP)) {
    if (t.startsWith(key)) return `## ${val}`;
  }
  return `## ${t}`;
}

function mergePara(lines) {
  const cleaned = lines.map((l) => normalizeParens(l.trim())).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.every((l) => l.length < 120 && /[：:]/.test(l))) {
    return cleaned.join('  \n');
  }
  if (cleaned.some((l) => l.length > 160)) {
    return cleaned.join('\n\n');
  }
  return cleaned.join('  \n');
}

/** Markdown の空行（段落区切り）を出力に残す */
function pushParagraphBreak(out) {
  if (out.length > 0 && out[out.length - 1] !== '') {
    out.push('');
  }
}

function standardContact() {
  return [
    '一般社団法人転回社',
    '',
    'mail：[ink@tenkai.org](mailto:ink@tenkai.org)  ',
    'tel：080-5289-9734（事務局）  ',
    'twitter：[@studioink_info](https://x.com/studioink_info)  ',
    '転回社公式LINEアカウント：@kua5940e',
    '',
    '主催：一般社団法人転回社',
  ];
}

function formatScheduleLine(raw, yearPrefix) {
  let item = normalizeParens(raw.replace(/^-\s+/, '').trim()).replace(/\)(\d)/, ') $1');
  if (/^\d{1,2}月\d{1,2}日/.test(item) && yearPrefix) {
    item = `${yearPrefix}年${item}`;
  }
  return item;
}

function formatSchedule(lines) {
  const out = [];
  let para = [];
  let yearPrefix = '';
  let dates = [];

  const flushPara = () => {
    const m = mergePara(para);
    if (m) out.push(m);
    para = [];
  };

  const flushDates = () => {
    if (dates.length === 0) return;
    const block = mergePara(dates);
    if (block) out.push(block);
    dates = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      pushParagraphBreak(out);
      continue;
    }
    const n = normalizeParens(line);

    if (/^(\d{4})年$/.test(n)) {
      yearPrefix = n.match(/^(\d{4})年$/)?.[1] ?? '';
      flushPara();
      flushDates();
      continue;
    }
    if (/^-\s+\d{4}年/.test(n) || /^\d{4}年\d{1,2}月/.test(n.replace(/^-\s+/, ''))) {
      flushPara();
      dates.push(formatScheduleLine(n, ''));
      continue;
    }
    if (/^-\s+\d{1,2}月/.test(n) || /^\d{1,2}月\d{1,2}日/.test(n)) {
      flushPara();
      dates.push(formatScheduleLine(n, yearPrefix));
      continue;
    }
    if (/^\[\d/.test(n)) {
      flushPara();
      flushDates();
      out.push(n);
      continue;
    }
    if (n.startsWith('※')) {
      flushPara();
      flushDates();
      if (out.length) out.push('');
      out.push(n);
      continue;
    }
    para.push(n);
  }
  flushPara();
  flushDates();
  return out;
}

function formatVenue(lines) {
  const out = [];
  let para = [];
  const notes = [];

  const flush = () => {
    const m = mergePara(para);
    if (m) out.push(m);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      pushParagraphBreak(out);
      continue;
    }
    if (line.startsWith('※')) {
      flush();
      notes.push(normalizeParens(line));
      continue;
    }
    para.push(line);
  }
  flush();
  for (const note of notes) {
    pushParagraphBreak(out);
    out.push(note);
  }
  return out;
}

function formatTickets(lines) {
  const out = [];
  let para = [];
  const links = [];

  const flush = () => {
    const m = mergePara(para);
    if (m) out.push(m);
    para = [];
  };

  for (const raw of lines) {
    let line = raw.trim();
    if (!line) {
      flush();
      pushParagraphBreak(out);
      continue;
    }
    line = normalizeParens(line);

    if (/^.+[：:].*\d.*円/.test(line) && !line.startsWith('[') && !line.startsWith('- ')) {
      flush();
      const m = line.match(/^(.+?)[：:]\s*(.+)$/);
      if (m) {
        out.push(`- ${m[1].trim()} ${formatYen(m[2])}`);
        continue;
      }
    }
    if (line.startsWith('- ')) {
      flush();
      out.push(line);
      continue;
    }
    if (line.startsWith('[')) {
      flush();
      links.push(line);
      continue;
    }
    para.push(line);
  }
  flush();
  if (links.length) {
    pushParagraphBreak(out);
    out.push(links.join('  \n'));
  }
  return out;
}

const TICKET_HANDLING_LINE =
  /Peatixでのお取り扱い|電子チケットPeatix|Peatixで予約|●Peatix|●メール|ご希望の公演日時|^チケット取り扱い/i;

/** 料金ブロックに混ざった取り扱い文を ## チケット取り扱い に戻す */
function splitPriceAndTicketHandling(section) {
  if (section.heading !== '## 料金') return [section];

  let splitAt = -1;
  let sawPrice = false;
  for (let i = 0; i < section.lines.length; i++) {
    const t = section.lines[i].trim();
    if (!t) continue;
    if (/円|無料\(/.test(t)) sawPrice = true;
    if (!sawPrice) continue;
    if (
      TICKET_HANDLING_LINE.test(t) ||
      (/^・/.test(t) && /peatix/i.test(t)) ||
      (/^●/.test(t) && !/円/.test(t)) ||
      (/^https?:\/\//i.test(t) && /peatix/i.test(t))
    ) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 0) return [section];

  while (splitAt > 0 && !section.lines[splitAt - 1]?.trim()) splitAt--;

  const prices = section.lines.slice(0, splitAt);
  const handling = section.lines.slice(splitAt);
  while (prices.length && !prices[prices.length - 1]?.trim()) prices.pop();

  if (handling.every((l) => !l.trim())) return [section];

  return [
    { heading: '## 料金', lines: prices },
    { heading: '## チケット取り扱い', lines: handling },
  ];
}

function formatContact(lines) {
  const text = lines.join('\n');
  const sponsor = lines
    .map((l) => l.trim())
    .filter((l) => /^後援：|^協力：/.test(l));
  const uniqueSponsor = [...new Set(sponsor)];

  const useStandard =
    /mail…|mail\.\.\.|twitter…|studio in\.K\.公式LINE/.test(text) ||
    (text.includes('一般社団法人転回社') && text.includes('主催：'));

  let main = useStandard ? standardContact() : formatGeneric(lines, 'お問い合わせ');

  if (uniqueSponsor.length) {
    const withoutDup = uniqueSponsor.filter(
      (s) => !main.some((line) => line.trim() === s),
    );
    if (withoutDup.length) {
      return [...main, '', ...withoutDup.map(normalizeParens)];
    }
  }
  return main;
}

function formatGeneric(lines, sectionName) {
  const out = [];
  let para = [];

  const flush = () => {
    const m = mergePara(para);
    if (m) {
      for (const block of m.split('\n\n')) out.push(block);
    }
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      pushParagraphBreak(out);
      continue;
    }
    if (line.startsWith('- ') || (/^\[.+\]\(.+\)$/.test(line) && !line.includes('\n'))) {
      flush();
      out.push(normalizeParens(line));
      continue;
    }
    if (line.startsWith('※')) {
      flush();
      out.push(normalizeParens(line));
      continue;
    }
    if (sectionName === '出演' && line.startsWith('出演：')) {
      flush();
      out.push(normalizeParens(line));
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

function formatIntro(lines) {
  const out = [];
  const credits = [];
  const rest = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      rest.push('');
      continue;
    }
    if (
      /^(作|脚本|演出|出演|演奏|原作|戯曲|作・|演出・|監修|音楽)/.test(line) ||
      (line.length <= 100 && /[：:]/.test(line) && !line.startsWith('['))
    ) {
      credits.push(line);
      continue;
    }
    rest.push(line);
  }

  let para = [];
  const flush = () => {
    const m = mergePara(para);
    if (m) {
      for (const block of m.split('\n\n')) out.push(block);
    }
    para = [];
  };

  for (const line of rest) {
    if (!line) {
      flush();
      pushParagraphBreak(out);
      continue;
    }
    if (line.startsWith('※')) {
      flush();
      out.push(normalizeParens(line));
      continue;
    }
    para.push(line);
  }
  flush();

  if (credits.length) {
    if (out.length) out.push('');
    const block = mergePara(credits);
    if (block) out.push(block);
  }

  return out;
}

function isPhotoGallerySection(name) {
  return /フォトギャラリー|photo\s*gallery/i.test(name);
}

function formatGallery(lines) {
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^!\[\]/.test(line)) {
      if (out.length) out.push('');
      out.push(line);
      continue;
    }
    out.push(normalizeParens(line));
  }
  return out;
}

function formatSection(section) {
  const name = section.heading?.replace(/^##\s+/, '') ?? '';
  const lines = section.lines;

  if (!section.heading) return formatIntro(lines);
  if (name === '日時' || name === '上演予定') return formatSchedule(lines);
  if (name === '場所') return formatVenue(lines);
  if (name === '料金') return formatTickets(lines);
  if (name === 'チケット取り扱い') return formatTickets(lines);
  if (name === 'お問い合わせ') return formatContact(lines);
  if (isPhotoGallerySection(name)) return formatGallery(lines);
  return formatGeneric(lines, name);
}

function parseSections(bodyLines) {
  const sections = [{ heading: null, lines: [] }];
  for (const line of bodyLines) {
    if (/^##\s+/.test(line) || /^###\s+/.test(line)) {
      sections.push({ heading: normalizeHeading(line.replace(/^###/, '##')), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  const merged = [];
  for (const sec of sections) {
    const last = merged[merged.length - 1];
    if (last && sec.heading && last.heading === sec.heading) {
      last.lines.push(...sec.lines);
    } else {
      merged.push({ heading: sec.heading, lines: [...sec.lines] });
    }
  }
  return merged;
}

export function normalizeEventBody(raw) {
  let text = raw.replace(/\r\n/g, '\n').trim();
  text = text.replace(/^\s*!\[\]\([^)]+\)\s*\n+/m, '');

  let lines = text.split('\n').map((l) => l.trimEnd());
  lines = lines.filter((l, i) => !(i < 3 && /^!\[\]\(/.test(l.trim())));

  const sections = parseSections(lines);
  const expanded = [];
  for (const sec of sections) {
    expanded.push(...splitPriceAndTicketHandling(sec));
  }
  const output = [];

  for (const section of expanded) {
    const formatted = formatSection(section);

    if (section.heading) {
      if (output.length) output.push('');
      output.push(section.heading);
      output.push('');
      const name = section.heading.replace(/^##\s+/, '');
      if (isPhotoGallerySection(name) && formatted.length) {
        output.push('<div class="prose-gallery">');
        output.push(...formatted);
        output.push('</div>');
      } else {
        output.push(...formatted);
      }
    } else if (formatted.length) {
      output.push(...formatted);
    }
  }

  return `${output.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
