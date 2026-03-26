#!/usr/bin/env bash
#
# sync-shared.sh - Update shared files in a consumer repo from the template source
#
# This script copies shared files (as defined in sync-manifest.json) from a source
# repo into a target (consumer) repo. Templated files are NOT touched — they are
# owned by the consumer repo after initial creation.
#
# Usage:
#   ./sync-shared.sh --target-dir <path> [options]
#
# Required:
#   --target-dir <path>       The consumer repo to update
#
# Optional:
#   --source-dir <path>       Source repo to sync from (default: repo containing this script)
#   --dry-run                 Show what would be copied without making changes
#   --help                    Show this help message
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Defaults
TARGET_DIR=""
SOURCE_DIR="$DEFAULT_SOURCE_DIR"
DRY_RUN=false

usage() {
    sed -n '3,/^$/s/^# \?//p' "$0"
    exit "${1:-0}"
}

die() {
    echo "ERROR: $1" >&2
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target-dir)   TARGET_DIR="$2"; shift 2 ;;
        --source-dir)   SOURCE_DIR="$2"; shift 2 ;;
        --dry-run)      DRY_RUN=true; shift ;;
        --help|-h)      usage 0 ;;
        *)              die "Unknown argument: $1" ;;
    esac
done

# Validate
[[ -n "$TARGET_DIR" ]] || die "--target-dir is required"
[[ -d "$TARGET_DIR" ]] || die "Target directory does not exist: $TARGET_DIR"
[[ -f "$SOURCE_DIR/rush.json" ]] || die "Source directory is not a Rush repo: $SOURCE_DIR"

MANIFEST="$SCRIPT_DIR/sync-manifest.json"
[[ -f "$MANIFEST" ]] || die "Sync manifest not found: $MANIFEST"

echo "Syncing shared files"
echo "  Source: $SOURCE_DIR"
echo "  Target: $TARGET_DIR"
if [[ "$DRY_RUN" == true ]]; then
    echo "  Mode:   DRY RUN (no changes will be made)"
fi
echo ""

COPIED=0
SKIPPED=0
WARNINGS=0

# Helper: increment counters safely (arithmetic returning 0 triggers set -e)
inc_copied() { COPIED=$((COPIED + 1)); }
inc_skipped() { SKIPPED=$((SKIPPED + 1)); }
inc_warnings() { WARNINGS=$((WARNINGS + 1)); }

# Helper to extract file pairs from manifest JSON sections
extract_json_pairs() {
    local section="$1"
    local key_field="$2"
    local val_field="$3"

    python3 -c "
import json, sys
with open('$MANIFEST') as f:
    data = json.load(f)
items = data.get('$section', {}).get('files', []) or data.get('$section', {}).get('packages', [])
for item in items:
    print(item.get('$key_field', '') + '|' + item.get('$val_field', ''))
" 2>/dev/null
}

# ──────────────────────────────────────────────────────────
# Sync individual shared files
# ──────────────────────────────────────────────────────────
echo "==> Syncing shared files..."

while IFS='|' read -r src dst; do
    [[ -n "$src" && -n "$dst" ]] || continue

    src_path="$SOURCE_DIR/$src"
    dst_path="$TARGET_DIR/$dst"

    if [[ ! -f "$src_path" ]]; then
        echo "  WARNING: Source not found: $src"
        inc_warnings
        continue
    fi

    if [[ "$DRY_RUN" == true ]]; then
        if [[ -f "$dst_path" ]]; then
            if diff -q "$src_path" "$dst_path" > /dev/null 2>&1; then
                echo "  [unchanged] $dst"
                inc_skipped
            else
                echo "  [would update] $dst"
                inc_copied
            fi
        else
            echo "  [would create] $dst"
            inc_copied
        fi
    else
        mkdir -p "$(dirname "$dst_path")"

        if [[ -f "$dst_path" ]] && diff -q "$src_path" "$dst_path" > /dev/null 2>&1; then
            inc_skipped
        else
            cp "$src_path" "$dst_path"
            echo "  Updated: $dst"
            inc_copied
        fi
    fi
done < <(extract_json_pairs "shared" "source" "destination")

# ──────────────────────────────────────────────────────────
# Sync shared packages (directories)
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Syncing shared packages..."

while IFS='|' read -r src dst; do
    [[ -n "$src" && -n "$dst" ]] || continue

    src_path="$SOURCE_DIR/$src"
    dst_path="$TARGET_DIR/$dst"

    if [[ ! -d "$src_path" ]]; then
        echo "  WARNING: Source directory not found: $src"
        inc_warnings
        continue
    fi

    if [[ "$DRY_RUN" == true ]]; then
        echo "  [would sync] $dst/"
        inc_copied
    else
        mkdir -p "$dst_path"
        # Use tar with --exclude to filter, piped to extract at destination
        (cd "$src_path" && tar cf - \
            --exclude='node_modules' \
            --exclude='lib' \
            --exclude='dist' \
            --exclude='.heft' \
            --exclude='temp' \
            --exclude='coverage' \
            .) | (cd "$dst_path" && tar xf -)
        echo "  Synced package: $dst"
        inc_copied
    fi
done < <(extract_json_pairs "sharedPackages" "source" "destination")

# ──────────────────────────────────────────────────────────
# Update sync metadata
# ──────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == false ]]; then
    SOURCE_COMMIT=""
    if [[ -e "$SOURCE_DIR/.git" ]]; then
        SOURCE_COMMIT="$(cd "$SOURCE_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")"
    fi

    SYNC_FILE="$TARGET_DIR/.template-sync"
    if [[ -f "$SYNC_FILE" ]]; then
        # Update lastSyncedAt and sourceCommit using python3 for reliable JSON editing
        python3 -c "
import json, sys
from datetime import datetime, timezone
with open('$SYNC_FILE') as f:
    data = json.load(f)
data['lastSyncedAt'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
data['sourceCommit'] = '$SOURCE_COMMIT'
with open('$SYNC_FILE', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null && echo "" && echo "  Updated .template-sync" || echo "  WARNING: Could not update .template-sync"
    fi
fi

# ──────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────
echo ""
echo "=== Sync complete ==="
echo "  Updated:   $COPIED"
echo "  Unchanged: $SKIPPED"
echo "  Warnings:  $WARNINGS"

if [[ "$DRY_RUN" == true ]]; then
    echo ""
    echo "This was a dry run. No files were modified."
    echo "Run without --dry-run to apply changes."
fi

if [[ "$DRY_RUN" == false && $COPIED -gt 0 ]]; then
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: cd $TARGET_DIR && git diff"
    echo "  2. Commit: git add -A && git commit -m 'Sync shared files from template'"
fi
