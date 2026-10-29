#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR/backend"
FASTAPI_ENV=development uv run python -c \
  "import app.main; import json; print(json.dumps(app.main.app.openapi()))" \
  > "$FRONTEND_DIR/openapi.json"

cd "$FRONTEND_DIR"
pnpm run generate-client
pnpm run lint
