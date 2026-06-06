# fgv Monorepo Template System

This directory contains scripts and configuration for creating and maintaining fgv-derived Rush monorepos.

## Overview

The fgv repository contains general-purpose TypeScript utilities (`@fgv/ts-utils`, `@fgv/ts-json`, etc.) alongside domain-specific code. This template system allows domain-specific code to live in its own monorepo while sharing infrastructure, coding standards, and agent configurations.

### Architecture

```
fgv (source of truth)
├── Utility libraries (published to npm)
├── Infrastructure & standards ──────► chocolate-lab (consumer)
│   ├── .ai/instructions/              ├── .ai/instructions/  (synced)
│   ├── .claude/agents/                ├── .claude/agents/    (synced)
│   ├── rigs/heft-dual-rig/           ├── rigs/heft-dual-rig/(synced)
│   └── ...                           ├── libraries/ts-chocolate/
│                                      ├── apps/chocolate-lab-web/
│                                      └── ... (domain code)
└── scripts/template/ (this dir)
    ├── create-repo.sh          ──────► Stamps out new repos
    ├── sync-shared.sh          ──────► Pushes updates to consumers
    └── patch-rush-config.mjs   ──────► JSONC config patching
```

## How It Works

### Repo Creation: `rush init` + Customize

New repos are created using Rush's own `rush init` as the foundation, which ensures:
- All Rush config files have full inline documentation
- New Rush features appear automatically as Rush evolves
- The config structure stays in sync with the installed Rush version

After `rush init`, the script applies fgv-specific customizations:

1. **JSONC patches** (via `patch-rush-config.mjs`): Targeted edits to rush.json and other config files that preserve comments and formatting
2. **Templated files**: Generated from `.tmpl` templates with parameter substitution (consumer-owned after creation)
3. **Shared files**: Copied verbatim from fgv (overwritten on each sync)

### What Gets Patched vs. Synced vs. Templated

| Category | During Create | During Sync | Examples |
|----------|--------------|-------------|---------|
| Rush config (from `rush init`) | Patched with fgv opinions | Not touched (consumer-owned) | rush.json, build-cache.json, pnpm-config.json |
| Templated files | Generated from .tmpl | Not touched (consumer-owned) | CLAUDE.md, command-line.json, version-policies.json |
| Shared files | Copied from fgv | Overwritten from fgv | .ai/instructions/, .claude/agents/, rigs/, .prettierrc.js |

### Rush Config Patches Applied

These targeted customizations are applied to `rush init` output:

| File | Patch | Reason |
|------|-------|--------|
| rush.json | `ensureConsistentVersions: true` | Enforce version consistency |
| rush.json | `projectFolderMinDepth/MaxDepth: 2` | Enforce category folder structure |
| rush.json | `repository.url`, `defaultBranch`, `defaultRemote` | Enable `rush change` |
| rush.json | Add heft-dual-rig and typedoc-compact-theme projects | Shared build infrastructure |
| build-cache.json | `buildCacheEnabled: true` | Enable build caching |
| pnpm-config.json | `strictPeerDependencies: true` | Catch peer dependency issues |

## File Categories

### Shared Files (synced verbatim)
These files are identical across all fgv-derived repos and are overwritten on each sync:

| Category | Files |
|----------|-------|
| Coding standards | `.ai/instructions/CODING_STANDARDS.md`, `TESTING_GUIDELINES.md`, `CODE_REVIEW_CHECKLIST.md`, `MONOREPO_GUIDE.md` |
| Workflows | `.ai/workflows/*.yaml` |
| Claude agents | `.claude/agents/**/*.md` |
| Build rig | `rigs/heft-dual-rig/` |
| TypeDoc theme | `plugins/typedoc-compact-theme/` |
| Code formatting | `.prettierrc.js`, `.gitattributes` |
| CI | `.github/workflows/ci.yml` |
| AI adapters | `.windsurfrules`, `.cursorrules`, `.github/copilot-instructions.md` |
| Prettier | `common/autoinstallers/rush-prettier/package.json` |

### Templated Files (generated once, then consumer-owned)
These files are parameterized during repo creation and never overwritten by sync:

| File | Parameters |
|------|-----------|
| `CLAUDE.md` | `{{PROJECT_TABLE}}` — library/purpose table |
| `command-line.json` | Generic commands only; add domain commands manually |
| `version-policies.json` | `{{VERSION_POLICY_NAME}}`, `{{VERSION}}` |
| `ACTIVE_DEVELOPMENT.md` | `{{ACTIVE_LIBRARIES}}` — domain project table |
| `.gitignore` | No parameters (but consumer may customize) |
| `package.json` | No parameters |

### Rush Config Files (from `rush init`, consumer-owned)
These files come from `rush init` with targeted patches applied during creation. They are never synced — consumers own them fully:

- `rush.json`, `common-versions.json`, `experiments.json`, `pnpm-config.json`, `build-cache.json`, `rush-plugins.json`, `.pnpmfile.cjs`, `.npmrc`, `.npmrc-publish`, `artifactory.json`, `cobuild.json`, `custom-tips.json`, `subspaces.json`

## Usage

### Creating a New Repo

```bash
./create-repo.sh \
  --target-dir /path/to/new-repo \
  --repo-url https://github.com/ErikFortune/new-repo \
  --version-policy my-domain \
  --version 0.1.0
```

For existing git repos (e.g., already created on GitHub):
```bash
./create-repo.sh \
  --target-dir /path/to/existing-repo \
  --repo-url https://github.com/ErikFortune/existing-repo \
  --version-policy my-domain \
  --version 0.1.0 \
  --allow-existing \
  --no-git-init
```

After creation:

1. Copy your domain packages into `libraries/`, `apps/`, `tools/`, `services/`
2. Register them in `rush.json` (use `patch-rush-config.mjs` or edit directly)
3. Convert `workspace:*` dependencies on `@fgv/*` utilities to published versions (e.g., `^5.1.0-0`)
4. Fill in `CLAUDE.md` project table and `ACTIVE_DEVELOPMENT.md`
5. Add domain-specific Rush commands to `command-line.json`
6. Run `rush install && rush build && rush test`

### Syncing Updates

When shared files (coding standards, agents, etc.) are updated in fgv:

```bash
# Preview what would change
./sync-shared.sh --target-dir /path/to/consumer-repo --dry-run

# Apply changes
./sync-shared.sh --target-dir /path/to/consumer-repo

# Review and commit in the consumer repo
cd /path/to/consumer-repo
git diff
git add -A
git commit -m "Sync shared files from fgv template"
```

### JSONC Config Patching

The `patch-rush-config.mjs` helper can modify any JSONC file while preserving comments:

```bash
# Set a value
node patch-rush-config.mjs rush.json --set 'ensureConsistentVersions=true'

# Uncomment a property then set its value
node patch-rush-config.mjs rush.json --uncomment 'projectFolderMinDepth' --set 'projectFolderMinDepth=2'

# Add to an array (JSON value)
node patch-rush-config.mjs rush.json --add-to-array 'projects={"packageName":"@my/lib","projectFolder":"libraries/my-lib"}'

# Set a value using raw JSON
node patch-rush-config.mjs rush.json --set-json 'repository={"url":"https://github.com/...","defaultBranch":"main"}'

# Remove a property
node patch-rush-config.mjs rush.json --remove 'telemetryEnabled'
```

### How Sync Tracking Works

Each consumer repo has a `.template-sync` file that records:
- When the repo was created from the template
- Which source commit was last synced
- When the last sync occurred

This is informational — the sync script always copies the latest files regardless of tracking state.

## Consuming @fgv/* Utilities

Domain repos depend on fgv utility packages via npm (not workspace links):

```json
{
  "dependencies": {
    "@fgv/ts-utils": "^5.1.0-0",
    "@fgv/ts-json": "^5.1.0-0"
  }
}
```

To update utility versions, use `rush add -p @fgv/ts-utils@^5.2.0` etc. in the consumer repo.

## Manifest Reference

The `sync-manifest.json` file is the source of truth for which files are shared vs. templated. It has three sections:

- **`shared`** — Individual files copied verbatim
- **`sharedPackages`** — Entire directories synced (excluding build artifacts)
- **`templated`** — Files generated from `.tmpl` templates during creation only

## Extending

### Adding a new shared file
1. Add an entry to `sync-manifest.json` under `shared.files`
2. Run `sync-shared.sh` against consumer repos

### Adding a new template parameter
1. Add `{{PARAM_NAME}}` to the `.tmpl` file
2. Add the substitution to `create-repo.sh`'s `render_template` function
3. Document the parameter in this README

### Adding a Rush config patch
1. Add the patch command to `create-repo.sh` in the "Patch rush config" step
2. Document the patch in this README's "Rush Config Patches Applied" table

### Creating a new consumer repo
Follow the "Creating a New Repo" steps above. The template system is designed so that consumer repos are fully independent after creation — they can diverge as needed while still receiving shared file updates via sync.
