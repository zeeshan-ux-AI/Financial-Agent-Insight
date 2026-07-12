#!/bin/bash
# Render build script for API server only
set -e

echo "=== Installing dependencies ==="
pnpm install --ignore-workspace-root-check

echo "=== Building lib/db ==="
pnpm --filter @workspace/db run build 2>/dev/null || echo "db build skipped"

echo "=== Building lib/api-zod ==="
pnpm --filter @workspace/api-zod run build 2>/dev/null || echo "api-zod build skipped"

echo "=== Building API server ==="
pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
