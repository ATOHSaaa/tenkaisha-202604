---
name: tenkaisha-dev-server
description: Starts and manages the Astro dev server for the tenkaisha official site (tenkaisha-202604). Use when the user asks to start, run, or restart the local development server, preview the site locally, open localhost, or check which port the dev server uses.
---

# 転回社サイト 開発サーバー起動

Astro v5 の開発サーバーを起動する手順。エージェントはユーザーに「起動して」と言われたら、この skill に従って **自分でコマンドを実行** する。

## 前提

- 作業ディレクトリ: リポジトリルート（`/Users/atohs/tenkaisha-202604` 相当）
- Node.js 18 以上
- 初回または `package.json` 変更後: `npm install`

## 起動コマンド（これを使う）

```bash
npm run dev:local
```

`npm start` も同じ（ポート自動選択付き）。

- デフォルトポート `4321` が空いていれば `4321` で起動
- 使用中なら `4322` にフォールバック（別プロジェクトが 4321 を使うことが多い）
- 起動前に URL を標準出力に表示

Astro 素の起動（ポート固定・フォールバックなし）が必要なときだけ:

```bash
npm run dev
```

本番ビルドの確認:

```bash
npm run build
npm run preview
```

`preview` は別ポート（通常 4321）— dev サーバーと同時起動しない。

## エージェント手順

1. **既存サーバーを確認**
   - `terminals/` フォルダで、このリポジトリで `npm run dev` が動いていないか確認
   - 必要なら `lsof -nP -iTCP:4321,4322 -sTCP:LISTEN`

2. **既にこのプロジェクトの dev サーバーが動いていれば** 新規起動しない。URL だけ案内する。

3. **起動**
   - `block_until_ms: 0` でバックグラウンド実行
   - コマンド: `npm run dev:local`
   - ネットワーク権限が必要な場合は `full_network` を付与

4. **起動完了を確認**
   - ターミナル出力に `Local` URL が出るまで待つ
   - ユーザーには **実際に使われたポート** の URL を伝える（例: `http://localhost:4322/`）

5. **型チェックだけ必要なとき** はサーバー起動不要。`npm run check` を使う。

## ポート早見表

| ポート | 用途 |
|--------|------|
| 4321 | Astro デフォルト。空いていればここ |
| 4322 | 4321 占有時のフォールバック（この環境でよく使う） |

## トラブルシュート

| 症状 | 対処 |
|------|------|
| `EADDRINUSE` | 別ポートで起動: `npm run dev -- --port 4322` |
| `node_modules` なし | `npm install` 後に再実行 |
| ページが古い | dev サーバー再起動。ブラウザのハードリロード |

## 関連コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev:local` / `npm start` | 開発サーバー（ポート自動選択・推奨） |
| `npm run dev` | Astro デフォルト起動（4321 固定） |
| `npm run build` | 静的サイトを `dist/` に出力 |
| `npm run preview` | ビルド結果のローカル確認 |
| `npm run check` | Astro + TypeScript チェック |
