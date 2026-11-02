#!/usr/bin/env bash
# Astro の Content Collections ストアを同期する。
# blog / stages / news 等が .astro/data-store.json に載らないと getCollection が空になることがあるため、
# node_modules/.astro の最新ストアを .astro/ に反映する。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TENKAISHA_ASTRO_CONTENT_SYNC=1 npx astro sync >/dev/null

SRC="$ROOT/node_modules/.astro/data-store.json"
DST="$ROOT/.astro/data-store.json"

if [[ ! -f "$SRC" ]]; then
  echo "sync-astro-content: missing $SRC (run npm install && npx astro sync)"
  exit 1
fi

mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
