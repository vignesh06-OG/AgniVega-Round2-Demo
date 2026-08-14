#!/usr/bin/env bash
# Smart Krishi-Yatra AI — one-command local setup.
#
#   ./scripts/setup.sh            # install deps, create .env, start dev server
#   ./scripts/setup.sh --docker   # same, but run everything inside Docker Compose
#   ./scripts/setup.sh --no-start # prepare only
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
MODE="local"
START=1

for arg in "$@"; do
  case "$arg" in
    --docker) MODE="docker" ;;
    --no-start) START=0 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

say() { printf "\033[0;32m==>\033[0m %s\n" "$1"; }
warn() { printf "\033[0;33m!! \033[0m %s\n" "$1"; }

# ---------------------------------------------------------------- environment
if [ ! -f .env ]; then
  say "Creating .env from .env.example"
  cp .env.example .env
  warn "Fill in VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env before signing in."
else
  say ".env already present — leaving it untouched"
fi

# ---------------------------------------------------------------- docker path
if [ "$MODE" = "docker" ]; then
  command -v docker >/dev/null || { echo "Docker is not installed. See https://docs.docker.com/get-docker/"; exit 1; }
  say "Building and starting containers (frontend + optional Python reference backend)"
  docker compose up --build ${START:+} $([ "$START" = "0" ] && echo "--no-start" || echo "")
  exit 0
fi

# ---------------------------------------------------------------- local path
if command -v bun >/dev/null 2>&1; then
  PKG="bun"
elif command -v npm >/dev/null 2>&1; then
  PKG="npm"
else
  echo "Neither bun nor npm found. Install Node.js 20+ (https://nodejs.org) and re-run."; exit 1
fi

say "Installing dependencies with $PKG"
if [ "$PKG" = "bun" ]; then bun install; else npm install; fi

if [ -d backend ] && command -v python3 >/dev/null 2>&1; then
  say "Preparing Python reference backend virtualenv (optional)"
  python3 -m venv backend/.venv 2>/dev/null || true
  # shellcheck disable=SC1091
  [ -f backend/requirements.txt ] && backend/.venv/bin/pip install -q -r backend/requirements.txt || true
fi

say "Verifying health endpoint wiring"
grep -q "api/public/health" "$ROOT/src/routes/api/public/health.ts" && say "health route present"

if [ "$START" = "1" ]; then
  say "Starting dev server on http://localhost:8080 (Ctrl+C to stop)"
  if [ "$PKG" = "bun" ]; then bun run dev; else npm run dev; fi
else
  say "Setup complete. Run '$PKG run dev' when ready."
fi