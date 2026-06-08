#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IP="${API_HOST:-$(ipconfig getifaddr en0 2>/dev/null || true)}"
if [[ -z "$IP" ]]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi

if [[ -z "$IP" ]]; then
  echo "Could not detect your Mac's LAN IP. Set API_HOST manually, e.g.:"
  echo "  API_HOST=192.168.1.42 $0"
  exit 1
fi

echo "Using API_HOST=$IP (physical iPhone → Mac backend on port 3000)"
exec flutter run --dart-define="API_HOST=$IP" "$@"
