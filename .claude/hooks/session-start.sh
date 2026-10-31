#!/bin/bash
set -euo pipefail

# Run only in Claude Code cloud sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Global tool: no ignored directory to hold a hash file, so check directly (idempotent)
if ! command -v omniroute >/dev/null 2>&1; then
  npm install -g omniroute
fi
