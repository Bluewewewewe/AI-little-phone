#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT="${PORT:-${DEPLOY_RUN_PORT:-5000}}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${PORT} for deploy..."
    PORT=${PORT} node dist/server.js
}

echo "Starting HTTP service on port ${PORT} for deploy..."
start_service
