#!/usr/bin/env node
/**
 * ブラウザ（Peatix 過去一覧をすべて読み込んだタブ）で DevTools Console に貼り付け、
 * 出力 JSON を scripts/peatix-past-snapshot.json に保存する。
 *
 * 手順:
 *   1. https://tenkai.peatix.com/events/past を開く
 *   2. 「その他のイベント」をボタンが消えるまでクリック
 *   3. 下記 IIFE をコンソールで実行 → コピーした JSON を snapshot に上書き
 *   4. node scripts/peatix-apply-to-events.mjs
 */

console.log(`(() => {
  const links = [...document.querySelectorAll('a[href$="/view"]')].filter(
    (a) => a.hostname.endsWith('peatix.com') && a.hostname !== 'tenkai.peatix.com',
  );
  const uniq = new Map();
  for (const a of links) {
    const href = a.href.split('?')[0];
    uniq.set(href, { href, text: a.textContent.trim().replace(/\\s+/g, ' ') });
  }
  copy(JSON.stringify([...uniq.values()], null, 2));
  return uniq.size;
})()`);
