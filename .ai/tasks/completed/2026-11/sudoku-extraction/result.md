# sudoku-extraction — result

**Shipped:** the three sudoku projects left fgv with their full history — 60 commits extracted to
`extract/sudoku-history` @ `13772cfca65d1516ace11428cf6be814a14aeb96` — and were removed from fgv
on `sudoku-extraction`, with the lockfile regenerated and live references swept.

## Part 1 — history extraction

- **Branch:** `origin/extract/sudoku-history` @ `13772cfca65d1516ace11428cf6be814a14aeb96`
  (shares no history with fgv's branches, as expected).
- **Commits:** 60 (7 of them merges), from `969ed8a60` "initial port of ts-sudoku lib (#18)"
  (2023-06-08) to `13772cfca` "Re-establish integration/asks after #770 promotion".
- **Paths kept:** `libraries/ts-sudoku-lib/`, `libraries/ts-sudoku-ui/`, `apps/sudoku/` — exactly
  these, no former paths. There were no renames: `--follow` on `ts-sudoku-lib/package.json` only
  reaches other packages through `C0xx` copy matches of a templated `package.json`; the folder was
  created fresh by #18 (see `state.md` § 1).
- **Verified:** the tip's tree for each of the three folders is byte-identical to `8b6f1252d`
  (`ts-sudoku-lib` `1a925ed9…`, `ts-sudoku-ui` `c7d3db62…`, `apps/sudoku` `a327c612…`); 834 files.
- **Method:** fresh `git clone --no-local /home/user/fgv` under the scratchpad, unshallowed from
  GitHub (the local clone is shallow — 102 commits vs 440), refs trimmed to one branch, then
  `git filter-repo 2.47.0 --force --refs extract-work --path libraries/ts-sudoku-lib/ --path
  libraries/ts-sudoku-ui/ --path apps/sudoku/`. Neither `/home/user/fgv` nor the worktree was
  touched. No scaffolding was added.

## Part 2 — removal from fgv

Commit `5a27cbf12` (plus this close-out) on `sudoku-extraction`.

**Removed (1,006 files):** the three project folders (834), their 35 pending change files under
`common/changes/@fgv/ts-sudoku-lib` and `ts-sudoku-ui` (`sudoku-app` had none), and the 137 generated
typedoc pages under `docs/api/@fgv/ts-sudoku-{lib,ui}`. Three `rush.json` entries removed (42 → 39
projects). No other project depended on them. `rush update`: lockfile loses 104 package entries and
gains none.

**References changed:**

| file | change |
|---|---|
| `CLAUDE.md`, `.ai/README.md` | `@fgv/ts-sudoku-lib` row removed from the library table |
| `.ai/instructions/MONOREPO_GUIDE.md` | `ts-sudoku-lib/` removed from the layout |
| `.ai/instructions/ACTIVE_DEVELOPMENT.md` | "Out-of-scope packages" → one-line "Moved out … before 5.1.0" |
| `.ai/instructions/LIBRARY_CAPABILITIES.md` | "Not listed: ts-sudoku-…" line removed |
| `docs/WORKSTREAMS.md` | "Out-of-scope packages" section removed |
| `docs/TECH_DEBT.md` | sudoku parts trimmed from three mixed entries (wall-clock parenthetical; browser micro-test list; wall-clock-assertions P3 list + trigger) |
| `docs/FUTURE.md` | "Type-check the three webpack apps" → two apps, 22 errors |
| `docs/api/README.md` | two package links removed |
| `.claude/agents/workflow-only/ux-designer.md` | "Sudoku-Specific UX Expertise" section removed |
| `common/scripts/verify-esm-entrypoints.mjs` | `@fgv/ts-sudoku-ui` `BUNDLER_ONLY` entry removed; comments repointed |
| `common/scripts/verify-capability-docs.mjs` | `EXEMPT` emptied (mechanism kept — its failure message names it) |
| `common/scripts/verify-bundler-resolution.mjs` | "apps/sudoku is the only webpack build" → the two tool webpack apps |
| `tools/ts-res-browser/tsconfig.json`, `tools/ts-res-ui-playground/tsconfig.json` | "Matches `apps/sudoku`" → names each other; `none` change file for `@fgv/ts-res-browser` |

**Left alone, with reason:** completed task folders, `docs/workstreams/*`, other CHANGELOGs
(historical, per brief); `.ai/tasks/active/library-capabilities-split/brief.md` (another stream's
frozen brief); `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md`
(dated note); `.claude/project/esm-emit-design.md` (design record of its measurements);
`docs/WORKSTREAMS.md` `ai-assist-thinking-config` out-of-scope line (historical stream scope);
`common/changes/@fgv/repo-template/sourcemaps_2026-04-29-13-14.json` (describes a change that
happened); the ux-designer agent's `description` example (an illustrative request).

## Gates

Logs in the scratchpad's `sudoku/`. Run from the worktree root via `install-run-rush.js`.

Graded by grep over each log: `not met|Operations failed|error TS|Jest tests? failed|ERR_PNPM` = **0**
in every log; case-insensitive `warning` = only the tracked-symlink notice ("Detected 1 Git-tracked
symlinks"), once each in rebuild / lint / test; NUL bytes 0. All ran in the foreground against
commit `5a27cbf12`; nothing left running.

| gate | result |
|---|---|
| `install` | exit 0 |
| `change --verify --target-branch origin/integration/asks` | exit 0 (finds the `ts-res-browser` change file) |
| `rebuild` | `SUCCESS: 36 operations` |
| `lint` | `SUCCESS: 32 operations`, `NO OP: 4` (36) |
| `test` | `SUCCESS: 35 operations`, `NO OP: 1` (36) |
| prettier 2.8.8 `--check` on touched `.md` | clean |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-capability-docs.mjs` | 26/26 libraries documented, 0 exempt, 0 failed |

Operation counts: `rush.json` went from 42 to 39 projects. The pre-removal operation counts were not
re-measured on this branch. The three removed projects all had `build` scripts, so the base would
have been 39 rebuild / test operations; that figure is inferred, not measured.

## What the new repository needs from the fgv root

The extracted branch contains only the three folders. To build, it needs:

1. **Rush scaffolding:** a `rush.json` with the three projects (same `projectFolder`s;
   `nodeSupportedVersionRange` `>=22.22.0 <23.0.0 || >=24.15.0 <25.0.0`, pnpm `11.28.9`), plus
   `common/config/rush/` — `pnpm-config.json` (incl. the minimum-release-age policy),
   `command-line.json` (the custom `test`, `lint`, `build-docs`, `prettier` commands the packages'
   scripts assume), `common-versions.json`, `experiments.json`, `build-cache.json`,
   `rush-plugins.json`, `.npmrc` / `.npmrc-publish` / `.pnpmfile.cjs`, a fresh `pnpm-lock.yaml`, and `common/scripts/install-run-rush*.js`.
   The `rush-prettier` autoinstaller if `rush prettier` is kept.
2. **A version policy.** Both libraries are on fgv's `base-utils` lockstep policy (5.1.0,
   `nextBump: minor`); `apps/sudoku` has none (`shouldPublish: false`). The new repo needs its own
   policy, or individual versioning — and `version-policies.json` with it.
3. **`workspace:*` deps that must become published ranges (`^5.1.0` once fgv 5.1.0 is out):**
   - `ts-sudoku-lib`: `@fgv/ts-utils` (dev + peer), `@fgv/ts-utils-jest`, `@fgv/ts-json-base`,
     `@fgv/heft-dual-rig`, `@fgv/typedoc-compact-theme` (dev).
   - `ts-sudoku-ui`: `@fgv/ts-utils`, `@fgv/ts-json-base` (deps); `@fgv/ts-utils-jest`,
     `@fgv/heft-dual-rig`, `@fgv/typedoc-compact-theme` (dev).
   - `apps/sudoku`: `@fgv/ts-utils`, `@fgv/ts-json-base`.
   - **Stay `workspace:*`** (in-repo): `ts-sudoku-ui` → `@fgv/ts-sudoku-lib`; `apps/sudoku` →
     `@fgv/ts-sudoku-ui`, `@fgv/ts-sudoku-lib`.
4. **Rigs and shared configs:** `ts-sudoku-lib` rigs on `@fgv/heft-dual-rig` (`config/rig.json`,
   `config/jest.config.json` extends its default profile) — published from fgv
   (`rigs/heft-dual-rig`, `shouldPublish: true`). Both libraries' `config/typedoc.json` extend
   `@fgv/heft-dual-rig/profiles/default/config/typedoc.compact-base.json`. `ts-sudoku-ui` and
   `apps/sudoku` rig on `@rushstack/heft-web-rig` (`library` / `app`), `ts-sudoku-lib`'s
   `tsconfig.json` extends `@rushstack/heft-node-rig` — npm packages, no fgv dependency.
5. **Root-relative paths that will break:** both `config/typedoc.json` files load the theme as
   `../../../plugins/typedoc-compact-theme/lib/index.js` (fgv's `plugins/` folder) — repoint to the
   `@fgv/typedoc-compact-theme` package. `apps/sudoku/tsconfig.json` maps `"@fgv/*"` to
   `../../libraries/*/src|lib`, which in the new repo would only resolve the two sudoku libraries —
   narrow it to them so `@fgv/ts-utils` / `ts-json-base` resolve from npm. `webpack.config.js`
   (`../../libraries`) and `tailwind.config.js` (`../../libraries/ts-sudoku-ui/…`) stay valid if the
   folder layout is kept.
6. **ESLint:** per-package flat configs require `@rushstack/eslint-config` (`flat/profile/node`,
   `mixins/packlets`, `mixins/tsdoc`) — npm, already devDependencies. No root eslint config is used.
7. **CI / repo files:** fgv's `.github/workflows` (none reference sudoku), Dependabot config,
   `LICENSE` (each library carries its own), root `.gitignore`, `.prettierrc.js` and `.prettierignore`, and the
   `rush change --verify` gate if kept. `CHANGELOG.json`/`.md` travel inside each library folder.
8. **Not needed:** nothing under fgv's `common/scripts/verify-*.mjs` covers the sudoku packages any
   more (the capability-docs gate exempted them; the ESM gate's only sudoku entry was removed).
