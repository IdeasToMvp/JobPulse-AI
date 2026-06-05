#!/usr/bin/env bash
# Builds Flutter web for Vercel. Backend stays on Railway; release builds use
# AppConfig.productionApiBaseUrl unless API_BASE_URL is set in Vercel env.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FLUTTER_CHANNEL="${FLUTTER_CHANNEL:-stable}"
FLUTTER_DIR="${FLUTTER_ROOT:-/vercel/flutter}"

if ! command -v flutter >/dev/null 2>&1; then
  if [ ! -d "$FLUTTER_DIR/.git" ]; then
    echo "Installing Flutter ($FLUTTER_CHANNEL)..."
    git clone https://github.com/flutter/flutter.git \
      -b "$FLUTTER_CHANNEL" \
      --depth 1 \
      "$FLUTTER_DIR"
  fi
  export PATH="$FLUTTER_DIR/bin:$PATH"
fi

flutter --version
flutter config --enable-web --no-analytics
flutter pub get

BUILD_ARGS=(build web --release --base-href /)

if [ -n "${API_BASE_URL:-}" ]; then
  echo "Using API_BASE_URL from Vercel env"
  BUILD_ARGS+=(--dart-define="API_BASE_URL=${API_BASE_URL}")
elif [ "${VERCEL_ENV:-}" = "preview" ] && [ -n "${VERCEL_URL:-}" ]; then
  echo "Preview build using production API (Railway)"
fi

flutter "${BUILD_ARGS[@]}"
echo "Web build complete → build/web"
