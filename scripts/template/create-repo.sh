#!/usr/bin/env bash
#
# create-repo.sh - Stamp out a new fgv-derived Rush monorepo
#
# Uses `rush init` to generate a standard Rush config with full documentation,
# then applies fgv-specific customizations via JSONC patching and shared file sync.
#
# Usage:
#   ./create-repo.sh --target-dir <path> --repo-url <url> [options]
#
# Required:
#   --target-dir <path>       Directory to create the new repo in
#   --repo-url <url>          GitHub repository URL (e.g., https://github.com/ErikFortune/chocolate-lab)
#
# Optional:
#   --version-policy <name>   Version policy name (default: "default")
#   --version <ver>           Initial version (default: "0.1.0")
#   --source-dir <path>       Source repo to copy shared files from (default: repo containing this script)
#   --allow-existing          Allow target directory to already exist (e.g., for existing git repos)
#   --no-git-init             Skip git init and initial commit
#   --help                    Show this help message
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default: source repo is the repo containing this script
DEFAULT_SOURCE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Defaults
TARGET_DIR=""
REPO_URL=""
VERSION_POLICY="default"
VERSION="0.1.0"
SOURCE_DIR="$DEFAULT_SOURCE_DIR"
GIT_INIT=true
ALLOW_EXISTING=false

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
        --target-dir)     TARGET_DIR="$2"; shift 2 ;;
        --repo-url)       REPO_URL="$2"; shift 2 ;;
        --version-policy) VERSION_POLICY="$2"; shift 2 ;;
        --version)        VERSION="$2"; shift 2 ;;
        --source-dir)     SOURCE_DIR="$2"; shift 2 ;;
        --allow-existing) ALLOW_EXISTING=true; shift ;;
        --no-git-init)    GIT_INIT=false; shift ;;
        --help|-h)        usage 0 ;;
        *)                die "Unknown argument: $1" ;;
    esac
done

# Validate required arguments
[[ -n "$TARGET_DIR" ]] || die "--target-dir is required"
[[ -n "$REPO_URL" ]] || die "--repo-url is required"
if [[ "$ALLOW_EXISTING" == false ]]; then
    [[ ! -e "$TARGET_DIR" ]] || die "Target directory already exists: $TARGET_DIR (use --allow-existing to override)"
fi
[[ -f "$SOURCE_DIR/rush.json" ]] || die "Source directory is not a Rush repo: $SOURCE_DIR"

MANIFEST="$SCRIPT_DIR/sync-manifest.json"
[[ -f "$MANIFEST" ]] || die "Sync manifest not found: $MANIFEST"

TEMPLATE_DIR="$SCRIPT_DIR/templates"
[[ -d "$TEMPLATE_DIR" ]] || die "Templates directory not found: $TEMPLATE_DIR"

PATCH_SCRIPT="$SCRIPT_DIR/patch-rush-config.mjs"
[[ -f "$PATCH_SCRIPT" ]] || die "Patch script not found: $PATCH_SCRIPT"

echo "Creating new monorepo at: $TARGET_DIR"
echo "  Source repo: $SOURCE_DIR"
echo "  Repo URL:    $REPO_URL"
echo "  Version:     $VERSION_POLICY@$VERSION"
echo ""

# Create target directory
mkdir -p "$TARGET_DIR"

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
# Step 1: Initialize Rush config via `rush init`
# ──────────────────────────────────────────────────────────
echo "==> Running rush init..."

# rush init requires an empty directory and no existing rush.json
if [[ -f "$TARGET_DIR/rush.json" ]]; then
    echo "  Target already has rush.json, skipping rush init"
else
    (cd "$TARGET_DIR" && npx "@microsoft/rush@5.172.1" init 2>&1) | sed 's/^/  /'
fi

# ──────────────────────────────────────────────────────────
# Step 2: Patch rush.json with fgv customizations
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Patching rush.json with fgv customizations..."

node "$PATCH_SCRIPT" "$TARGET_DIR/rush.json" \
    --set "nodeSupportedVersionRange=>=14.15.0 <15.0.0 || >=16.13.0 <17.0.0 || >=18.15.0 <19.0.0 || >=20.18.0 <21.0.0 || >=22.22.0 <23.0.0" \
    --set "ensureConsistentVersions=true" \
    --uncomment "projectFolderMinDepth" \
    --set "projectFolderMinDepth=2" \
    --uncomment "projectFolderMaxDepth" \
    --set "projectFolderMaxDepth=2" \
    --uncomment "url" \
    --set "repository.url=$REPO_URL" \
    --uncomment "defaultBranch" \
    --uncomment "defaultRemote" \
    --add-to-array "projects={\"packageName\":\"@fgv/heft-dual-rig\",\"projectFolder\":\"rigs/heft-dual-rig\",\"shouldPublish\":false,\"tags\":[\"tools\",\"rig\"]}" \
    --add-to-array "projects={\"packageName\":\"@fgv/typedoc-compact-theme\",\"projectFolder\":\"plugins/typedoc-compact-theme\",\"shouldPublish\":false,\"tags\":[\"plugins\",\"typedoc\"]}"

# ──────────────────────────────────────────────────────────
# Step 3: Patch other rush config files where we have opinions
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Patching rush config files..."

# Enable build cache (rush init defaults to false)
node "$PATCH_SCRIPT" "$TARGET_DIR/common/config/rush/build-cache.json" \
    --set "buildCacheEnabled=true"

# Enable strict peer dependencies
node "$PATCH_SCRIPT" "$TARGET_DIR/common/config/rush/pnpm-config.json" \
    --uncomment "strictPeerDependencies" \
    --set "strictPeerDependencies=true"

# ──────────────────────────────────────────────────────────
# Step 4: Replace config files where we have substantive content
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Generating templated config files..."

render_template() {
    local template_file="$1"
    local dest_file="$2"

    if [[ ! -f "$template_file" ]]; then
        echo "  WARNING: Template not found, skipping: $template_file"
        return
    fi

    mkdir -p "$(dirname "$dest_file")"

    # Simple variable substitution
    sed \
        -e "s|{{REPO_URL}}|$REPO_URL|g" \
        -e "s|{{VERSION_POLICY_NAME}}|$VERSION_POLICY|g" \
        -e "s|{{VERSION}}|$VERSION|g" \
        "$template_file" > "$dest_file"

    echo "  Generated: $dest_file"
}

# Process each templated file from manifest
while IFS='|' read -r tmpl dst; do
    [[ -n "$tmpl" && -n "$dst" ]] && render_template "$SOURCE_DIR/$tmpl" "$TARGET_DIR/$dst"
done < <(extract_json_pairs "templated" "template" "destination")

# ──────────────────────────────────────────────────────────
# Step 5: Copy shared files (verbatim from source)
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Copying shared files..."

copy_shared_file() {
    local src="$1"
    local dst="$2"
    local src_path="$SOURCE_DIR/$src"
    local dst_path="$TARGET_DIR/$dst"

    if [[ ! -f "$src_path" ]]; then
        echo "  WARNING: Source file not found, skipping: $src"
        return
    fi

    mkdir -p "$(dirname "$dst_path")"
    cp "$src_path" "$dst_path"
    echo "  Copied: $dst"
}

copy_shared_package() {
    local src="$1"
    local dst="$2"
    local src_path="$SOURCE_DIR/$src"
    local dst_path="$TARGET_DIR/$dst"

    if [[ ! -d "$src_path" ]]; then
        echo "  WARNING: Source directory not found, skipping: $src"
        return
    fi

    mkdir -p "$dst_path"
    # Copy directory contents, excluding build artifacts
    (cd "$src_path" && tar cf - \
        --exclude='node_modules' \
        --exclude='lib' \
        --exclude='dist' \
        --exclude='.heft' \
        --exclude='temp' \
        --exclude='coverage' \
        .) | (cd "$dst_path" && tar xf -)
    echo "  Copied package: $dst"
}

# Copy individual shared files
while IFS='|' read -r src dst; do
    [[ -n "$src" && -n "$dst" ]] && copy_shared_file "$src" "$dst"
done < <(extract_json_pairs "shared" "source" "destination")

# Copy shared packages (directories)
while IFS='|' read -r src dst; do
    [[ -n "$src" && -n "$dst" ]] && copy_shared_package "$src" "$dst"
done < <(extract_json_pairs "sharedPackages" "source" "destination")

# ──────────────────────────────────────────────────────────
# Step 6: Create standard empty directories
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Creating directory structure..."

mkdir -p "$TARGET_DIR/libraries"
mkdir -p "$TARGET_DIR/tools"
mkdir -p "$TARGET_DIR/apps"
mkdir -p "$TARGET_DIR/services"
mkdir -p "$TARGET_DIR/.ai/tasks/active"
mkdir -p "$TARGET_DIR/.ai/tasks/completed"
mkdir -p "$TARGET_DIR/.claude/project"
mkdir -p "$TARGET_DIR/.claude/skills"

# Create placeholder files so git tracks empty directories
touch "$TARGET_DIR/.ai/tasks/active/.gitkeep"
touch "$TARGET_DIR/.ai/tasks/completed/.gitkeep"
touch "$TARGET_DIR/.claude/project/.gitkeep"
touch "$TARGET_DIR/.claude/skills/.gitkeep"

echo "  Created standard directory structure"

# ──────────────────────────────────────────────────────────
# Step 7: Record template sync metadata
# ──────────────────────────────────────────────────────────
echo ""
echo "==> Recording template metadata..."

SOURCE_COMMIT=""
if [[ -e "$SOURCE_DIR/.git" ]]; then
    SOURCE_COMMIT="$(cd "$SOURCE_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")"
fi

cat > "$TARGET_DIR/.template-sync" <<EOF
{
  "templateSource": "$REPO_URL",
  "sourceRepo": "$(cd "$SOURCE_DIR" && git remote get-url origin 2>/dev/null || echo "local")",
  "sourceCommit": "$SOURCE_COMMIT",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "lastSyncedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "manifestVersion": "1.0.0"
}
EOF
echo "  Created .template-sync"

# ──────────────────────────────────────────────────────────
# Step 8: Initialize git repo (optional)
# ──────────────────────────────────────────────────────────
if [[ "$GIT_INIT" == true ]]; then
    echo ""
    echo "==> Initializing git repository..."
    (
        cd "$TARGET_DIR"
        git init -b main
        git add -A
        git commit -m "Initial commit from fgv monorepo template

Source: $SOURCE_DIR
Template commit: $SOURCE_COMMIT"
    )
    echo "  Git repository initialized with initial commit"
fi

# ──────────────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────────────
echo ""
echo "=== Monorepo created successfully at: $TARGET_DIR ==="
echo ""
echo "Next steps:"
echo "  1. Add your domain packages to libraries/, apps/, tools/, services/"
echo "  2. Register them in rush.json (use patch-rush-config.mjs or edit directly)"
echo "  3. Fill in the project table in CLAUDE.md"
echo "  4. Fill in ACTIVE_DEVELOPMENT.md with your domain projects"
echo "  5. Add domain-specific Rush commands to common/config/rush/command-line.json"
echo "  6. Run: cd $TARGET_DIR && rush install && rush build"
echo ""
