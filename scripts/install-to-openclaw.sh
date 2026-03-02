#!/usr/bin/env bash
# Install Pixel Office extension into OpenClaw for local development.
# Usage: ./scripts/install-to-openclaw.sh [--link]
#   --link: symlink instead of copy (for development)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXT_DIR="${OPENCLAW_EXTENSIONS_DIR:-$HOME/.openclaw/extensions}"
PLUGIN_DIR="$EXT_DIR/pixel-office"

LINK_MODE=false
if [[ "${1:-}" == "--link" ]]; then
  LINK_MODE=true
fi

mkdir -p "$EXT_DIR"

if [[ -d "$PLUGIN_DIR" ]]; then
  echo "Removing existing $PLUGIN_DIR"
  rm -rf "$PLUGIN_DIR"
fi

if $LINK_MODE; then
  echo "Linking extensions/pixel-office -> $PLUGIN_DIR (dev mode)"
  mkdir -p "$EXT_DIR"
  ln -sf "$REPO_ROOT/extensions/pixel-office" "$PLUGIN_DIR"
else
  echo "Copying extensions/pixel-office to $PLUGIN_DIR"
  cp -r "$REPO_ROOT/extensions/pixel-office" "$PLUGIN_DIR"
fi

echo ""
echo "Done. Pixel Office plugin is at $PLUGIN_DIR"
echo ""
echo "Next:"
echo "  1. openclaw plugins install -l \"$REPO_ROOT/extensions/pixel-office\""
echo "     (or add to config: plugins.load.paths = [\"$REPO_ROOT/extensions/pixel-office\"])"
echo "  2. Restart OpenClaw Gateway: openclaw gateway status && openclaw gateway restart"
echo ""
echo "Note: Plugin scaffold is ready. Full implementation (orchestrator + web UI + live 2D) in progress."
echo "      For now use: pnpm dev:site (builder) and pnpm dev:runtime (orchestration)"
