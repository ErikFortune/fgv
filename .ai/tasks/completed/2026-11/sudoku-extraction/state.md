# sudoku-extraction — state

Worker-owned. Judgement calls and questions; the brief is not edited.

## Judgement calls

1. **No former paths passed to filter-repo.** `git log --follow --name-status` on
   `libraries/ts-sudoku-lib/package.json` walks into `libraries/ts-utils/package.json` and
   `libraries/ts-bcp47/package.json`, but every step is a `C0xx` copy match (a near-identical
   `package.json` template), not a rename. The folder was created fresh by `068faea63` "initial port
   of ts-sudoku lib (#18)", which adds `libraries/ts-sudoku-lib/src/**` directly. `ts-sudoku-ui` and
   `apps/sudoku` show only an `A` of their own path. A repo-wide `-M` search for renames whose
   destination is under the three folders but whose source is outside them found none. Following
   the copy matches would have imported all of `ts-utils`' early history into the sudoku repo,
   which is wrong.
2. **The local clone is shallow** (`/home/user/fgv` and the worktree: `is-shallow-repository =
   true`, 102 commits). The scratch clone was therefore unshallowed from GitHub
   (`git fetch --unshallow origin integration/asks`) before filtering; full history is 440 commits.
3. **Scratch clone hygiene.** Before running filter-repo (with `--force`, since the clone had been
   fetched into), the `origin` remote, every branch except the work branch, and all 2,173 local
   tags were removed **in the scratch clone only**, so filter-repo could not rewrite anything else
   and nothing could be pushed by accident. The push used an explicit URL and refspec.
4. **Generated API docs removed.** `docs/api/@fgv/ts-sudoku-lib` and `ts-sudoku-ui` (137 files)
   are typedoc output from the root `typedoc.json` (`entryPoints: ["libraries/*"]`); a
   regeneration would drop them, so they were removed with the two `docs/api/README.md` links
   rather than left as docs for packages that no longer exist here.
5. **`verify-capability-docs.mjs` keeps `EXEMPT` as an empty set** rather than deleting the
   mechanism: its failure message tells authors to add a package to `EXEMPT` with a reason, so the
   variable is part of the script's contract.
6. **`verify-esm-entrypoints.mjs`**: the `@fgv/ts-sudoku-ui` `BUNDLER_ONLY` entry was removed (the
   package is gone) and "Both entries below" became "The entry below".
7. **Webpack-app comments repointed.** `verify-bundler-resolution.mjs` called `apps/sudoku` "the
   repo's only webpack build" — already untrue (`tools/ts-res-browser` and
   `tools/ts-res-ui-playground` are webpack apps) and now dangling; it names those two instead. The
   two tools' `tsconfig.json` comments said "Matches `apps/sudoku`, the repo's other webpack app";
   each now names the other tool. Touching `tools/ts-res-browser` (published) needed a `none`
   change file; `ts-res-ui-playground` is `shouldPublish: false`.
8. **`docs/FUTURE.md` § Type-check the webpack apps** trimmed to the two remaining apps; the error
   total became 22 (`ts-res-ui-playground`'s count; `ts-res-browser` had 0), and the drift examples
   kept are the `@fgv/ts-res` / `ts-res-ui-components` ones, which are not sudoku symbols.
9. **`.claude/agents/workflow-only/ux-designer.md`**: the "Sudoku-Specific UX Expertise" section
   (introduced "Given the project context") was removed — the project context it describes left.
   The agent's `description` example ("a sudoku game …") was left: it is an illustrative user
   request, not a claim about this repo.
10. **`docs/WORKSTREAMS.md` § Out-of-scope packages** removed outright; the one-line "moved out"
    note lives in `ACTIVE_DEVELOPMENT.md` as the brief directs.

## Left alone, with reason

- `.ai/tasks/completed/**`, `docs/workstreams/*`, other packages' `CHANGELOG`s — historical, per brief.
- `.ai/tasks/active/library-capabilities-split/brief.md` — another stream's orchestrator-owned
  frozen brief.
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` — a dated note.
- `.claude/project/esm-emit-design.md` — a design record of measurements at its time.
- `docs/WORKSTREAMS.md:390` (`ai-assist-thinking-config` "Out-of-scope: … sudoku packages") — a
  historical scope statement inside a stream entry.
- `common/changes/@fgv/repo-template/sourcemaps_2026-04-29-13-14.json` — another package's pending
  change comment ("fix ts-sudoku-ui leaks"); it describes a change that did happen.

## Dependents

None. No remaining `package.json` names `@fgv/ts-sudoku-lib`, `@fgv/ts-sudoku-ui` or
`@fgv/sudoku-app`; `rush update` succeeded with the lockfile losing 104 package entries and gaining none.
