# publish-workflow-rework — brief

**Base:** `branch-model-plan` (PR #784, the branch-migration plan, not yet merged into
`integration/asks`; this branch builds on it). **Branch:** `publish-workflow-rework`.
**Contract:** `.ai/notes/orchestrator/branch-migration-checklist.md` on this branch — sections
*Target model*, *Automated publish*, *Supply-chain pinning*, *Phase 0 (orchestrator items)* and
*Phase 1*. Read the whole checklist first. This brief adds decisions and limits; where they differ,
this brief wins. Orchestrator-owned; record questions and judgement calls in `state.md`.

**Why now:** the first non-alpha publish under the new model (5.1.0) runs these workflows. The
maintainer will press "publish" by hand in the morning; nothing in this stream publishes, pushes to
`main`/`release`/`prerelease`, or dispatches a workflow.

## Scope

1. **Publish workflows** (`.github/workflows/publish.yml`, `publish-*-impl.yml`):
   - Guards first: `release` and `major` run only on `refs/heads/publish/*`; `alpha` only on
     `refs/heads/prerelease`. A `publish/*` run must find that its HEAD descends from some
     `origin/release/<n>` and that the version policy's major equals `<n>`; and it must refuse if the
     version it is about to publish already exists on npm for `@fgv/ts-utils`. Each guard fails with a
     message naming what was expected.
   - Stable path adds `rush test` after rebuild (it has none today).
   - **Version and changelog in-workflow.** Establish by experiment (below) the exact rush command
     sequence that, from a tree whose version policy and `package.json`s say `5.1.0` with pending
     change files, **publishes 5.1.0** (not 5.2.0), **writes the 5.1.0 section of every
     `CHANGELOG.json`/`CHANGELOG.md` from the change files**, **deletes the consumed change files**,
     and leaves the version policy ready for the next release. The current stable impl runs
     `rush publish --publish --include-all` without `--apply`; the 5.0.2 CHANGELOGs suggest that path
     never wrote changelogs, which is the manual fix-up the maintainer wants gone. Encode exactly the
     sequence the experiment proves. Keep the alpha path's observable behaviour (versions `-alpha.N`/
     `5.1.0-N` as today, `--tag alpha`) unchanged except for guards and pinning — prove with the same
     experiment that alpha behaviour is unchanged.
   - After publishing: commit the bump (version policy, package.json, CHANGELOGs, deleted change
     files) on the `publish/*` branch, push it and the per-package tags, then open the PR
     `publish/<version>` → `release/<major>` and a **draft** PR `release/<major>` → `main` (the
     merge-back; draft because it must wait for the first to merge). Use `gh` with the job's
     `GITHUB_TOKEN` (`pull-requests: write`). Write a `$GITHUB_STEP_SUMMARY` with the version, package
     list and PR links.
   - The `major` job: same shape; keep `--override-bump major` semantics only if the experiment shows
     they are still needed, and say which in `state.md`.
2. **`ci.yml`** triggers per the checklist: push `['main']`; pull_request `['main', 'release/**',
   'publish/**', 'prerelease', 'integration/**']`. Keep `release` in the pull_request list too until
   the drain is done (the current PR flow targets `release`), and note in the checklist that it is
   removed in the docs-sweep phase. Change-verify keeps keying off `base_ref`.
3. **Delete** `publish-legacy.yml`, `publish-alpha-legacy.yml`, `publish-major-legacy.yml`; grep the
   repo for `NPM_TOKEN` and resolve every hit.
4. **Supply-chain pinning**, every item in the checklist section:
   - every `uses:` → full 40-char SHA + `# vX.Y.Z` comment. Resolve SHAs from the upstream tag with
     `git ls-remote https://github.com/<owner>/<repo> refs/tags/<tag>` (dereference annotated tags:
     use the `^{}` line). Pin the **latest patch of the major in use today** (v5 for checkout and
     setup-node) unless a newer major is a drop-in; record each source tag and SHA in `result.md`.
   - replace `snow-actions/git-config-user` with `git config user.name/user.email` in a `run:` step,
     values unchanged (the publish jobs read them from the existing secrets);
   - `npm install -g npm@<exact>` (pick the current npm 11.x patch at least 7 days old; record why);
   - `.github/dependabot.yml`: add a `github-actions` ecosystem (weekly), keep `npm` as is;
   - top-level `permissions: contents: read` everywhere; grant write scopes per job only;
   - `persist-credentials: false` on checkout in jobs that never push;
   - add a CI step that fails if any `uses:` in `.github/workflows/` is not pinned to a 40-hex SHA
     (local `./` reusable-workflow references are exempt).
5. **Update the checklist** (`branch-migration-checklist.md`): tick what this stream did, record the
   experiment's result (the proven command sequence) in *Automated publish*, and set the status line
   to "Phase 0 (orchestrator) and Phase 1 done on <branch>; Phases 2–4 pending".

## The experiment (required, before encoding)

Run on a **throwaway clone under the scratchpad**, never on `/home/user/fgv*` worktrees:
`git clone --no-local /home/user/fgv-wf <scratch>/pubexp`, then in it reproduce the stable path
locally **without** publishing — `--publish` must never be passed, and no npm token exists anyway:
- `rush install`, then try candidate sequences (e.g. `rush version --bump ...`,
  `rush publish --apply --include-all --pack --release-folder <dir>`, with/without
  `--override-bump`, `--prerelease-name`) and inspect after each: resulting `package.json` versions,
  `version-policies.json`, `CHANGELOG.json`/`.md` 5.1.0 sections (are entries populated from change
  files?), whether `common/changes/` was emptied, and which tarball versions `--pack` produced.
- Reset the scratch clone between candidates (`git reset --hard && git clean -fdx common/changes`
  — only inside the scratch clone).
- Record every candidate and its observed result in `result.md` as a table. The encoded workflow
  must be the candidate whose result matches the requirement; if none does, stop and write that up
  in `state.md` rather than inventing one.
- Also run the alpha impl's exact command with `--pack` instead of `--publish` to confirm its
  behaviour is unchanged.

## Validation

- `actionlint` on every workflow (fetch a pinned release binary into the scratchpad; record the
  version) — zero findings, or each remaining one explained.
- YAML parses; the pinning-check step passes against the new files and fails against a deliberately
  unpinned copy (show both).
- `node common/scripts/install-run-rush.js change --verify --target-branch origin/integration/asks`
  passes (workflow files are not packages; add a `none` change file only if a package file changes).
- `npx -y prettier@2.8.8 --check` on touched `.md`/`.yml`.
- No `rush rebuild`/`rush test` gate is needed unless you touch package or script files; if you
  touch `common/scripts/*`, run the full gate.

## Process

- Do not spawn subagents. Commit before any long-running step; run everything in the foreground.
  Nothing left running at the end. Logs under
  `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/wf/`.
- Close out per `finalize-task` into `.ai/tasks/completed/2026-11/publish-workflow-rework/` with
  `result.md`, ledger entry (`docs/workstreams/2026-11.md`, `docs/WORKSTREAMS.md`; add only your own
  entry and index id — other streams edit these files in parallel), PR `#TBD`.
- Push `publish-workflow-rework`. Never force-push, rebase, delete branches, open a PR, dispatch a
  workflow, or push to any branch other than your own.
- Report: head SHA, the experiment table and the chosen sequence, every pinned action (tag → SHA),
  actionlint result, and anything that needs the maintainer (settings, secrets, decisions).
