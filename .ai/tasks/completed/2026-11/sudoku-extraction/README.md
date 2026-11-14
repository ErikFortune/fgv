# sudoku-extraction — the sudoku packages leave fgv, with their history

**Shipped**: 2026-11-14 into `integration/asks` via #TBD. History branch:
`extract/sudoku-history` @ `13772cfca`.

## Summary

`@fgv/ts-sudoku-lib`, `@fgv/ts-sudoku-ui` and `@fgv/sudoku-app` (`apps/sudoku`) left this monorepo
before the 5.1.0 publish. Their full history — 60 commits, from #18 (2023-06-08) to the current
`integration/asks` — was extracted with `git filter-repo` into a standalone-history branch for a new
repository, and the three projects were then removed from fgv: folders, `rush.json` entries,
pending change files, generated API docs, lockfile entries, and live references.

## Files changed

- Removed: `libraries/ts-sudoku-lib/`, `libraries/ts-sudoku-ui/`, `apps/sudoku/`,
  `common/changes/@fgv/ts-sudoku-{lib,ui}/`, `docs/api/@fgv/ts-sudoku-{lib,ui}/` (1,006 files).
- `rush.json`, `common/config/rush/pnpm-lock.yaml` (via `rush update`).
- Reference sweep: `CLAUDE.md`, `.ai/README.md`, `.ai/instructions/{ACTIVE_DEVELOPMENT,
  LIBRARY_CAPABILITIES,MONOREPO_GUIDE}.md`, `docs/{WORKSTREAMS,TECH_DEBT,FUTURE}.md`,
  `docs/api/README.md`, `.claude/agents/workflow-only/ux-designer.md`,
  `common/scripts/verify-{esm-entrypoints,capability-docs,bundler-resolution}.mjs`,
  `tools/{ts-res-browser,ts-res-ui-playground}/tsconfig.json`, and a `none` change file for
  `@fgv/ts-res-browser`.

## Decisions made during execution

See `state.md`. The ones a later reader most needs: no former paths were extracted (the
`--follow` "history" before #18 is copy detection on a templated `package.json`, not a rename);
the scratch clone had to be unshallowed from GitHub because the local clone is shallow; generated
`docs/api` pages were removed with the packages; `verify-capability-docs.mjs` keeps an empty
`EXEMPT` set because its failure message names it.

## Followups

- Standing up the new repository is the maintainer's: `result.md` § "What the new repository
  needs from the fgv root" is the checklist.
- Once the new repo exists, `extract/sudoku-history` can be retired from the fgv remote (a
  maintainer decision; nothing here deletes it).

## References

- Brief: `brief.md`
- Judgement calls: `state.md`
- Exit artifact: `result.md`
- PR: #TBD
