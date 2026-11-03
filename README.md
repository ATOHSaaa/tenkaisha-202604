# 転回社 公式サイト

熊本市を中心に活動する劇団「一般社団法人 転回社」の公式サイト。

- 技術スタック: [Astro v5](https://astro.build) / TypeScript
- ホスティング: ロリポップサーバー（FTPで `dist/` を配置）
- ドメイン: `tenkai.org`（旧 `ink.tenkai.org` は `.htaccess` で 301 リダイレクト）

---

## クイックスタート

前提: Node.js 18 以上

```bash
# 依存インストール
npm install

# 開発サーバ（推奨: ポート自動選択）
npm run dev:local
# または npm start

# Astro デフォルト（4321 固定）
npm run dev

# 本番ビルド（静的ファイルを dist/ に出力）
npm run build

# 出力確認
npm run preview
```

ビルド後、`dist/` 配下の内容をロリポップのドキュメントルートに **FTPで** 丸ごと転送してください。

---

## ディレクトリ構成

```
.
├── astro.config.mjs
├── package.json
├── public/                     # 静的アセット（そのまま配信される）
│   ├── .htaccess               # ロリポップ(Apache) 用。リダイレクト/キャッシュ/圧縮
│   ├── favicon.svg
│   ├── robots.txt
│   └── images/                 # 画像（モックSVG + 既存サイトから取得した写真）
│       ├── logo.png
│       ├── ogp.svg
│       ├── photos/
│       ├── mocks/
│       ├── publications/
│       └── members/
├── src/
│   ├── content.config.ts       # Content Collections 定義（blog / stages / news）
│   ├── content/
│   │   ├── blog/*.md           # ブログ
│   │   ├── news/*.md           # おしらせ
│   │   └── stages/*.md         # 公演・イベント（type: performance | event）
│   ├── data/site.ts            # スタジオ/メンバー/クラス/依頼窓口/刊行物 等のデータ
│   ├── layouts/Base.astro      # 共通レイアウト（OGP, フォント, Header/Footer）
│   ├── components/             # ヘッダー, フッター, カード, 見出し等
│   ├── pages/                  # ルーティング
│   └── styles/global.css       # デザイントークン + 共通スタイル
```

---

## お知らせ（News）の書き方

`src/content/news/` に新しい Markdown ファイルを追加するだけで、トップページと `/news/` 一覧に自動で掲載されます。

```markdown
---
title: "4月公演のチケット先行販売を開始しました"
date: 2026-04-10
# link: "https://tenkai.peatix.com/" # 外部リンクに飛ばしたいときだけ
---

本文を Markdown で記述します。
```

- ファイル名は `YYYY-MM-DD-keyword.md` 推奨（`id` がそのまま URL スラッグになります）
- `date` は YAML の日付表記（クォート不要）

### ブログ

`src/content/blog/` に追加。スキーマは `src/content.config.ts` 参照。`cover` はSVG/JPG/PNGいずれもOK。

### 公演・イベント

`src/content/stages/` に Markdown を追加します。フロントマターは **`title` を先頭**にし、続けて **`type`**（種別）を指定します。

- **`type: long-run`** … バッジ「ロングラン上演中！」（赤）
- **`type: performance`** … バッジ「公演」（黄）
- **`type: event`** … バッジ「イベント」（黄）

`type` でバッジを出し分けます。トップ・一覧の「これから」は **`status` ではなく日付** で判定します。**公演・イベントとも日程は `performanceHistory` のみ**（`- 2026-11-05` のように日付だけ並べる。クォート不要）。過去＋これからの回を並べ、最終日と次回を自動算出します。上演履歴 UI は **今日より前** の分だけ表示。カードの「次回公演」は **`performanceHistory` の並びで最初の未来回**（詳細と同じソース・表示形式）です。

**`long-run` / `performance`** では任意で **`tickets`**（チケットボタン、複数可）。各要素に `label` と `url` を指定します。`long-run` は詳細サイド、`performance` はヒーローに表示されます。

```yaml
tickets:
  - label: チケットを購入
    url: https://tenkai.peatix.com/
  - label: 当日券の案内
    url: https://example.com/
```

---

## デザイン方針

- ベース: **モダン・ミニマル**
- アクセント: **黄色 `#f2cf1a`（実験演劇的なエッジ）**
- フォント: **Noto Sans JP（和文）** + **Archivo（Latin）**（Google Fonts）
- 角は基本的に **直角**。太い黒ボーダーでグラフィカルに整理
- スクロール連動アニメーションは **なし**。ホバー時のみ控えめなインタラクション

アクセントカラーや罫線太さは `src/styles/global.css` 先頭のトークン（`:root`）で一括変更できます。

---

## 外部連携の差し替え

`src/data/site.ts` に集約しています。

| 項目 | 変数 | 差し替え時 |
|---|---|---|
| お問い合わせフォーム | `contactFormUrl` | 実運用のGoogleフォームURLに置換 |
| SNSリンク | `social[]` | 各アカウントURLを入れる |
| メンバー紹介 | `members[]` | 写真・名前・役割・プロフィール |
| スタジオ一覧 | `studios[]` | - |
| 開講クラス | `src/content/classes/*.md` | **本文**に見出し・段落を書く。`summary` は一覧カード用、`schedule` / `target` / `fee` は詳細サイドバー用 |
| 依頼窓口 | `requests[]` | - |
| 刊行物 | `publications[]` | 追加刊行時に増やす |

`src/components/Footer.astro` の `social` 配列も差し替え対象です（現在は `site.ts` と重複しているので、必要ならリファクタしてください）。

---

## 旧サイトからのリダイレクト

`public/.htaccess` に 301 リダイレクトを記述しています。主な変換:

- `ink.tenkai.org/stage-info/` → `tenkai.org/stages/`
- `ink.tenkai.org/juniorclass/` → `tenkai.org/classes/junior/`
- `ink.tenkai.org/blog/` → `tenkai.org/blog/`
- `ink.tenkai.org/YYYY/MM/*` → `tenkai.org/blog/`（年月パーマリンクを一覧に寄せる）
- `ink.tenkai.org/*` → `tenkai.org/*`（最終フォールバック）
- 旧 `tenkai.org/about.html` → `/about/`、`/school.html` → `/requests/school/`、`/member.html` → `/requests/members/`

### ink.tenkai.org のドメイン運用について

`ink.tenkai.org` は、リダイレクトを効かせるために以下のいずれかの対応が必要です。

1. **サブドメインを `tenkai.org` と同じドキュメントルートに向ける**（推奨）
   - 両ドメインで同じ `.htaccess` が効くため、上記の RewriteRule がそのまま機能します
2. **DNS で CNAME `ink.tenkai.org` → `tenkai.org` を設定**
   - ロリポップ側でエイリアスドメイン設定を追加

ロリポップの「独自ドメイン設定」からサブドメインを追加し、公開フォルダを `tenkai.org` と同一にすることで、最もシンプルに運用できます。

---

## デプロイ（FTP 手順のメモ）

1. ローカルで `npm run build`
2. 出力された `dist/` の **中身** をすべて FTP でロリポップのドキュメントルートへアップロード
   - FTP クライアントは FileZilla / Cyberduck 等
   - `dist/` フォルダ自体をアップロードせず、中身だけを配置してください
3. `.htaccess` が正しく配置されているかを確認（隠しファイルを表示する設定を ON に）
4. 本番サイトでトップ・`/news/`・`/stages/076/` など代表ページをブラウザチェック

---

## TODO / 差し替え候補

- [ ] `src/data/site.ts` のダミー情報を正式な値に差し替え
- [ ] Google フォームのURLを `contactFormUrl` に設定
- [ ] 所属メンバーの実写写真を `public/images/members/` に配置
- [ ] 公演／クラス／依頼窓口の本番キービジュアルを配置（現在はSVGモック）
- [ ] アクセス解析（GA4 等）の導入検討 → `src/layouts/Base.astro` に `<script>` 追加
- [ ] 公開前に `astro.config.mjs` の `site` を本番ドメインで再確認
