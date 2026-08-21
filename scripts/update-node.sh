#!/usr/bin/env bash
# 从 GitHub Release（CI 发布的 latest-dist）下载 .output，解压到 APP_DIR 并重启服务
# 服务器只需 Node.js 运行时，无需完整业务源码 / npm install
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/devcoffer}
GITHUB_REPO=${GITHUB_REPO:-}
DIST_TAG=${DIST_RELEASE_TAG:-latest-dist}
ASSET_NAME=${DIST_ASSET_NAME:-nuxt-poc-output.tar.gz}
SERVICE_NAME=${SERVICE_NAME:-devcoffer}
APP_PORT=${APP_PORT:-3000}
DIST_URL=${DIST_DOWNLOAD_URL:-}

if [ -z "$GITHUB_REPO" ] && [ -z "$DIST_URL" ]; then
  echo "[update-node] ERROR: 请设置 GITHUB_REPO=owner/repo 或 DIST_DOWNLOAD_URL" >&2
  exit 1
fi

if [ -z "$DIST_URL" ]; then
  DIST_URL="https://github.com/${GITHUB_REPO}/releases/download/${DIST_TAG}/${ASSET_NAME}"
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "[update-node] download: $DIST_URL"
CURL_AUTH=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  CURL_AUTH=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

# GitHub Release 大文件经 CDN 时 HTTP/2 偶发 stream 中断（curl exit 18）
curl_download() {
  local url=$1
  local out=$2
  curl -fsSL --http1.1 \
    --retry 5 \
    --retry-delay 2 \
    --retry-all-errors \
    --connect-timeout 30 \
    --max-time 900 \
    -C - \
    "${CURL_AUTH[@]}" \
    -o "$out" \
    "$url"
}

ARCHIVE="$TMP/${ASSET_NAME}"
curl_download "$DIST_URL" "$ARCHIVE"

SHA_URL="${DIST_URL}.sha256"
if curl -fsSL --http1.1 --retry 3 --connect-timeout 15 --max-time 60 \
  "${CURL_AUTH[@]}" -o "${ARCHIVE}.sha256" "$SHA_URL" 2>/dev/null; then
  echo "[update-node] verify sha256"
  HASH=$(awk 'NF>=1 {print $1; exit}' "${ARCHIVE}.sha256")
  if [ -n "$HASH" ]; then
    printf '%s  %s\n' "$HASH" "$(basename "$ARCHIVE")" > "${ARCHIVE}.sha256"
  fi
  (cd "$TMP" && sha256sum -c "$(basename "$ARCHIVE").sha256")
else
  echo "[update-node] skip sha256 (asset missing)"
fi

STAGE="$TMP/extract"
mkdir -p "$STAGE"
tar -xzf "$ARCHIVE" -C "$STAGE"

if [ ! -f "$STAGE/.output/server/index.mjs" ]; then
  # 兼容打包时直接把 .output 内容打进根目录的情况
  if [ -f "$STAGE/server/index.mjs" ]; then
    mkdir -p "$STAGE/.output"
    # 若解压结果就是 .output 内容
    if [ -d "$STAGE/server" ] && [ ! -d "$STAGE/.output/server" ]; then
      find "$STAGE" -mindepth 1 -maxdepth 1 ! -name '.output' -exec mv {} "$STAGE/.output/" \;
    fi
  fi
fi

if [ ! -f "$STAGE/.output/server/index.mjs" ]; then
  echo "[update-node] ERROR: archive missing .output/server/index.mjs" >&2
  ls -la "$STAGE" >&2 || true
  exit 1
fi

mkdir -p "$APP_DIR"

# 备份上一版
if [ -d "$APP_DIR/.output" ]; then
  rm -rf "$APP_DIR/.output.bak"
  mv "$APP_DIR/.output" "$APP_DIR/.output.bak"
fi

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$STAGE/.output"/ "$APP_DIR/.output"/
else
  mkdir -p "$APP_DIR/.output"
  find "$APP_DIR/.output" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a "$STAGE/.output"/. "$APP_DIR/.output"/
fi

echo "[update-node] deployed to $APP_DIR/.output"
if [ -f "$APP_DIR/.output/COMMIT.txt" ]; then
  echo "[update-node] COMMIT=$(cat "$APP_DIR/.output/COMMIT.txt")"
fi
if [ -f "$APP_DIR/.output/BUILT_AT.txt" ]; then
  echo "[update-node] BUILT_AT=$(cat "$APP_DIR/.output/BUILT_AT.txt")"
fi

restart_ok=0
if systemctl list-unit-files "${SERVICE_NAME}.service" >/dev/null 2>&1; then
  echo "[update-node] systemctl restart $SERVICE_NAME"
  if command -v sudo >/dev/null 2>&1; then
    sudo systemctl restart "$SERVICE_NAME"
  else
    systemctl restart "$SERVICE_NAME"
  fi
  restart_ok=1
elif command -v pm2 >/dev/null 2>&1; then
  echo "[update-node] pm2 restart $SERVICE_NAME"
  pm2 restart "$SERVICE_NAME" --update-env
  restart_ok=1
else
  echo "[update-node] WARN: 未找到 systemd/pm2，请手动启动: node $APP_DIR/.output/server/index.mjs"
fi

sleep 2
if curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1 \
  || curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null 2>&1; then
  echo "[update-node] health check ok (:$APP_PORT)"
else
  echo "[update-node] WARN: health check failed on :$APP_PORT" >&2
  if [ "$restart_ok" -eq 1 ]; then
    exit 1
  fi
fi

echo "[update-node] OK"
