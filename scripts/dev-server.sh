#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "node_modules not found. Run: npm install"
  exit 1
fi

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

PORT=4321
if port_in_use "$PORT"; then
  PORT=4322
  if port_in_use "$PORT"; then
    echo "Ports 4321 and 4322 are in use. Try: npm run dev -- --port 4323"
    exit 1
  fi
  echo "Port 4321 is in use. Using ${PORT} instead."
fi

echo "http://localhost:${PORT}/"
bash "$ROOT/scripts/sync-astro-content.sh"
exec npm run dev -- --port "$PORT"
