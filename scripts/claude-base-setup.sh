#!/usr/bin/env bash
# Installs the base Claude Code token-saving setup into ~/.claude so it applies
# to every project and every session:
#   - drona23/claude-token-efficient  -> ~/.claude/CLAUDE.md (global rules)
#   - JuliusBrussee/caveman skill     -> ~/.claude/skills/caveman (always on)
#
# Use it as a cloud environment setup script, or run it once on your own machine.
# Sources are pinned to reviewed commits; bump the SHAs below to update.
set -euo pipefail

TOKEN_EFFICIENT_SHA=0d30a6db75af983b8ababf585f28faefdfc87895
CAVEMAN_SHA=9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fetch() { # repo sha dest
  git init -q "$3"
  git -C "$3" fetch -q --depth 1 "https://github.com/$1" "$2"
  git -C "$3" checkout -q FETCH_HEAD
}

fetch drona23/claude-token-efficient "$TOKEN_EFFICIENT_SHA" "$TMP/te"
fetch JuliusBrussee/caveman "$CAVEMAN_SHA" "$TMP/cm"

mkdir -p "$CLAUDE_DIR/skills/caveman"
cp "$TMP/cm/skills/caveman/SKILL.md" "$TMP/cm/LICENSE" "$TMP/cm/NOTICE" "$CLAUDE_DIR/skills/caveman/"

# Rewrite only the block between the markers so personal notes in CLAUDE.md survive.
BEGIN='<!-- claude-base:begin -->'
END='<!-- claude-base:end -->'
TARGET="$CLAUDE_DIR/CLAUDE.md"
touch "$TARGET"
awk -v b="$BEGIN" -v e="$END" '$0==b{skip=1} !skip{print} $0==e{skip=0}' "$TARGET" > "$TMP/rest"
{
  echo "$BEGIN"
  sed 's/^- No emojis or em-dashes\.$/- No emojis or em-dashes in chat replies./' "$TMP/te/CLAUDE.md"
  echo
  echo '## Response style'
  echo '- Chat replies follow the caveman skill below (always on; say "stop caveman" to turn off). Code, comments, commits and docs stay in normal prose.'
  echo
  echo "@$CLAUDE_DIR/skills/caveman/SKILL.md"
  echo "$END"
  cat "$TMP/rest"
} > "$TARGET"

echo "claude-base: installed into $CLAUDE_DIR"
