# fgv Monorepo Template System

This directory contains scripts and configuration for creating and maintaining fgv-derived Rush monorepos.

## Overview

The fgv repository contains general-purpose TypeScript utilities (`@fgv/ts-utils`, `@fgv/ts-json`, etc.) alongside domain-specific code. This template system allows domain-specific code to live in its own monorepo while sharing infrastructure, coding standards, and agent configurations.

### Architecture

```
fgv (source of truth)
├── Utility libraries (published to npm)
├── Infrastructure & standards ──────► fgv-chocolate (consumer)
│   ├── .ai/instructions/              ├── .ai/instructions/  (synced)
│   ├── .claude/agents/                ├── .claude/agents/    (synced)
│   ├── rigs/heft-dual-rig/           ├── rigs/heft-dual-rig/(synced)
│   └── ...                           ├── libraries/ts-chocolate/
│                                      ├── apps/chocolate-lab-web/
│                                      └── ... (domain code)
└── scripts/template/ (this dir)
    ├── create-repo.sh          ──────► Stamps out new repos
    └── sync-shared.sh          ──────► Pushes updates to consumers
```

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
| Rush config | `common-versions.json`, `pnpm-config.json`, `.pnpmfile.cjs`, `build-cache.json`, `rush-plugins.json`, `experiments.json` |
| Prettier | `common/autoinstallers/rush-prettier/package.json` |

### Templated Files (generated once, then consumer-owned)
These files are parameterized during repo creation and never overwritten by sync:

| File | Parameters |
|------|-----------|
| `CLAUDE.md` | `{{PROJECT_TABLE}}` — library/purpose table |
| `rush.json` | `{{REPO_URL}}`, `{{PROJECTS}}` — repo URL and project list |
| `command-line.json` | Generic commands only; add domain commands manually |
| `version-policies.json` | `{{VERSION_POLICY_NAME}}`, `{{VERSION}}` |
| `ACTIVE_DEVELOPMENT.md` | `{{ACTIVE_LIBRARIES}}` — domain project table |
| `.gitignore` | No parameters (but consumer may customize) |
| `package.json` | No parameters |

## Usage

### Creating a New Repo

```bash
./create-repo.sh \
  --target-dir /path/to/fgv-chocolate \
  --repo-url https://github.com/ErikFortune/fgv-chocolate \
  --version-policy chocolate \
  --version 0.1.0
```

This creates an empty but structurally complete Rush monorepo with all shared infrastructure. After creation:

1. Copy your domain packages into `libraries/`, `apps/`, `tools/`, `services/`
2. Register them in `rush.json`
3. Convert `workspace:*` dependencies on `@fgv/*` utilities to published versions (e.g., `^5.1.0-0`)
4. Fill in `CLAUDE.md` project table and `ACTIVE_DEVELOPMENT.md`
5. Add domain-specific Rush commands to `command-line.json`
6. Run `rush install && rush build && rush test`

### Syncing Updates

When shared files (coding standards, agents, etc.) are updated in fgv:

```bash
# Preview what would change
./sync-shared.sh --target-dir /path/to/fgv-chocolate --dry-run

# Apply changes
./sync-shared.sh --target-dir /path/to/fgv-chocolate

# Review and commit in the consumer repo
cd /path/to/fgv-chocolate
git diff
git add -A
git commit -m "Sync shared files from fgv template"
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

### Creating a new consumer repo
Follow the "Creating a New Repo" steps above. The template system is designed so that consumer repos are fully independent after creation — they can diverge as needed while still receiving shared file updates via sync.
