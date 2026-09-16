#!/usr/bin/env bash
#
# sync.sh — refresh this repo's tracked files from the live pi setup and
# commit (and optionally push) the result.
#
# Usage:
#   ./sync.sh                 # copy files, show what changed
#   ./sync.sh -c              # copy + commit
#   ./sync.sh -p              # copy + commit + push to origin
#   ./sync.sh -n              # copy only (same as no flags)
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

COMMIT=false
PUSH=false
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--commit) COMMIT=true ;;
    -p|--push)   COMMIT=true; PUSH=true ;;
    -n|--noop)   COMMIT=false; PUSH=false ;;
    *) POSITIONAL+=("$1") ;;
  esac
  shift
done

PI_AGENT="${HOME}/.pi/agent"
AGENTS="${HOME}/.agents"

check_src() {
  [[ -f "$1" ]] || { echo "!! missing source: $1"; exit 1; }
}

check_src "${PI_AGENT}/settings.json"
check_src "${PI_AGENT}/AGENTS.md"
check_src "${PI_AGENT}/APPEND_SYSTEM.md"
check_src "${PI_AGENT}/models-store.json"
check_src "${PI_AGENT}/extensions/quotas.json"
check_src "${AGENTS}/.skill-lock.json"

# --- copy tracked files from the live setup ---
mkdir -p extensions
cp "${PI_AGENT}/settings.json"        settings.json
cp "${PI_AGENT}/AGENTS.md"            AGENTS.md
cp "${PI_AGENT}/APPEND_SYSTEM.md"     APPEND_SYSTEM.md
cp "${PI_AGENT}/models-store.json"    models-store.json
cp "${PI_AGENT}/extensions/quotas.json" extensions/quotas.json
cp "${AGENTS}/.skill-lock.json"       skills-lock.json

echo ""
echo "== changed since last sync =="
git status --short

if [[ "$COMMIT" == "true" ]]; then
  git add -A
  if git diff --cached --quiet; then
    echo ""
    echo "== no changes to commit =="
  else
    git commit -m "Sync pi setup: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo ""
    echo "== committed =="
  fi
fi

if [[ "$PUSH" == "true" ]]; then
  git push origin HEAD
  echo "== pushed =="
fi