#!/usr/bin/env bash
set -euo pipefail

# project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# load envs
if [ -f .env ]; then set -a; source .env; set +a; fi
if [ -f .env.local ]; then set -a; source .env.local; set +a; fi

PORT="${PORT:-3000}"

# kill any existing local ngrok agent session quietly
if command -v killall >/dev/null 2>&1; then
  (killall -9 ngrok >/dev/null 2>&1) || true
fi

if [ -n "${NGROK_AUTHTOKEN:-}" ]; then
  # configure authtoken silently if provided
  (bun x ngrok config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null 2>&1) || true
fi

echo "[ngrok] starting on port $PORT ${NGROK_DOMAIN:+(domain: $NGROK_DOMAIN)}"

if [ -n "${NGROK_DOMAIN:-}" ]; then
  if command -v bun >/dev/null 2>&1; then
    exec bun x ngrok http --domain "$NGROK_DOMAIN" "$PORT"
  else
    exec npx -y ngrok http --domain "$NGROK_DOMAIN" "$PORT"
  fi
else
  if command -v bun >/dev/null 2>&1; then
    exec bun x ngrok http "$PORT"
  else
    exec npx -y ngrok http "$PORT"
  fi
fi
