# docs-regen-5-1-0 — brief

**Base:** `sudoku-extraction` (#786) merged with `integration/asks` (#784, #785). **Branch:**
`docs-regen-5-1-0`. Orchestrator-owned; record judgement calls in `state.md`.

**Why:** release prep for the 5.1.0 non-alpha publish. The committed generated API docs were last
regenerated 2026-08-21 (#652) and are three months stale.

## Scope

1. **Per-package docs.** The 12 projects with a `build-docs` script (`ts-bcp47`, `ts-extras`,
   `ts-http-storage`, `ts-json-base`, `ts-json`, `ts-random`, `ts-res-ui-components`, `ts-res`,
   `ts-utils-jest`, `ts-utils`, `ts-web-extras`, `tools/ts-res-cli`): after a full
   `node common/scripts/install-run-rush.js install` and `rebuild`, run
   `node common/scripts/install-run-rush.js build-docs` and commit the regenerated `docs/` folders
   (additions, changes and deletions — stale pages for removed symbols must go).
2. **Root `docs/api`** (from the root `typedoc.json`, `entryPoints: libraries/*`). There is no script
   for it. Find out how it was last produced (git log of `docs/api`, the root `typedoc.json`, the rig
   it extends) and reproduce it with the repo's own typedoc version (resolve it from a project's
   `node_modules`, never an unpinned `npx typedoc`). If it regenerates cleanly, commit it — it will
   now cover every package under `libraries/`, which is intended. If it cannot be reproduced without
   adding dependencies or scripts, do not improvise: leave `docs/api` as is and write the gap up in
   `state.md` and `docs/FUTURE.md` (one short entry).
3. Do **not** add `build-docs` scripts to packages that lack them; list those packages in
   `result.md` as a follow-up.
4. Sanity-check the output: no absolute paths or machine-specific strings in generated files
   (`grep -r "/home/\|/tmp/" docs libraries/*/docs`), no sudoku pages, generated file counts before
   and after per package in `result.md`.

## Change files

Generated docs live inside packages, so `rush change --verify --target-branch origin/integration/asks`
will require a change file for each touched package: add `none`-type files, comment
"Regenerated API documentation." (one per package). Other release-prep streams are rewriting
`common/changes/` in parallel — name your files `docs-regen-5-1-0_2026-11-14-00-00.json` so they
are distinct, and do not touch any other change file.

## Process

- No subagents. Commit before long steps; run gates in the foreground; nothing left running. Logs
  under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/docs/`.
- Gates: `install`, `change --verify --target-branch origin/integration/asks`, `rebuild` (needed for
  docs anyway). No `test` or `lint` gate is needed since no source changes. Prettier is not run on
  generated docs.
- Close out per `finalize-task` into `.ai/tasks/completed/2026-11/docs-regen-5-1-0/` (headline `''`),
  ledger entry, PR `#TBD`. Add only your own ledger entry and index id.
- Push `docs-regen-5-1-0`. Never force-push, rebase, delete branches, open a PR, or push elsewhere.
- Report: head SHA, per-package file counts before/after, root `docs/api` outcome, follow-ups.
