#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${API_PORT:-3010}"
MAIN_PORT="${MAIN_PORT:-3003}"
PORTAL_PORT="${PORTAL_PORT:-3004}"

PIDS=()

cleanup() {
  local code=$?
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  wait >/dev/null 2>&1 || true
  exit "$code"
}

trap cleanup INT TERM EXIT

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Freeing port :$port"
    # Intentionally stop stale local dev servers to ensure a clean startup.
    kill $pids >/dev/null 2>&1 || true
  fi
}

cd "$ROOT_DIR"

kill_port "$API_PORT"
kill_port "$MAIN_PORT"
kill_port "$PORTAL_PORT"

echo "Starting API on :$API_PORT"
PORT="$API_PORT" NODE_ENV=development pnpm dev:api &
PIDS+=("$!")

echo "Starting main app on :$MAIN_PORT"
pnpm exec vite --host --port "$MAIN_PORT" --strictPort &
PIDS+=("$!")

echo "Starting customer portal on :$PORTAL_PORT"
pnpm -C customer-portal exec vite --host --port "$PORTAL_PORT" --strictPort &
PIDS+=("$!")

echo "All servers starting..."
echo "Main app:      http://127.0.0.1:$MAIN_PORT"
echo "Customer portal:http://127.0.0.1:$PORTAL_PORT"

wait -n
