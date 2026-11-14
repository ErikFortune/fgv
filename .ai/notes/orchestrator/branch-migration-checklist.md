# Branch-migration checklist — `main` as trunk, `release/<major>` trains, publish from a child

**Status: Phase 0 (orchestrator) and Phase 1 done on `publish-workflow-rework`; Phases 2–4 pending.** Target model locked with Erik 2026-11-14. This replaces the
2026-07-20 plan (PR #566), which had `main` publishing stable releases and a `published` pointer
branch. That plan was never executed. The rework is a prerequisite for the 5.1.0 non-alpha
publish: the first stable publish runs under the new model.

## Target model

| branch | role | who writes it |
|---|---|---|
| `main` | Trunk. Every feature PR and integration branch targets it; CI push-gate runs on it. **Never published from.** | PRs only. No workflow pushes to it. |
| `release/<major>` (`release/5`, later `release/6`, …) | One per live release train. Always equals what is on npm for that major, plus anything promoted and awaiting publish. | PRs only: promotions from `main`, merges of a `publish/*` child, hotfix PRs. Strict branch protection; no workflow bypass needed. |
| `publish/<version>` (e.g. `publish/5.1.0`) | Short-lived child of `release/<major>` that a stable publish runs on. Its bump commit (version policy, consumed change files, CHANGELOGs) is exactly what npm receives. | The publish workflow, then merged into `release/<major>`. |
| `prerelease` | Alpha publishes for the next minor. Synced from `main`; its bump commits never return. | Sync from `main`; the alpha publish workflow. |

**Why publish from a child, not from `release/<major>` directly.** The bump commit lands on a branch the
workflow may write to, so `release/<major>` stays PR-only. The child also lets repo-side touch-ups to
CHANGELOGs ride in before it merges — **after** the run: the workflow refuses to start unless the child
is exactly the train's tip, so nothing unreviewed is published. **Limit:** the changelog inside the npm tarball is the one the run
writes at publish time (a dry `pnpm pack` of `ts-extras` on 2026-11-14 carried `CHANGELOG.json` and no
`CHANGELOG.md`), so curation that must reach consumers happens **before** the publish, in
`common/changes/`. Edits on the child after publishing fix the repo, not the shipped package.

**Git ref constraint.** A branch named `release` and a branch named `release/5` cannot coexist
(`refs/heads/release` would be both a file and a directory), and neither can `release/5` and
`release/5/<x>`. Hence: `release` is deleted before `release/5` is created, and children use their
own prefix (`publish/*`), never `release/5/...`.

### The release flow (stable)

1. **Promote:** PR `main` → `release/<major>`. Merge commit. This is the release decision; test the
   promoted state on `release/<major>` (testbed run) before going further.
2. **Branch** `publish/<version>` off the tip of `release/<major>` and push nothing else to it.
3. **Dispatch** the stable publish on `publish/<version>` straight away (see *Automated publish*
   below); the guard requires `HEAD` to equal `origin/release/<major>`. One run does
   install, verify, build, version bump, changelog generation, commit, tag, publish, and opens both
   follow-up PRs.
4. **Merge** `publish/<version>` → `release/<major>` with a **merge commit, never squash**, so the
   published commit stays in `release/<major>`'s history and the per-package tags keep resolving.
5. **Merge back** `release/<major>` → `main` (merge commit). Without it `main` keeps the consumed change
   files (they would reappear in the next release's changelog) and its version policy would still name
   the old version. The publish workflow opens this PR automatically.
6. Bump `.ai/BASELINE.md` to the published commit and version.

### Alphas

`prerelease` is synced from `main` and dispatches the alpha publish, as today. After the first stable
publish under this model it is **recreated from `main`** so alphas continue at `<next minor>.0-N`
(recreating before the stable publish would restart at 5.1.0-0 and collide with the existing 5.1.0-N
alphas). It stays a single branch tracking `main`; alphas are always for the next minor on trunk.

### Multiple trains

When `main` moves to 6.x, `release/5` keeps living. A 5.x hotfix: branch from `release/5`, PR into
`release/5`, publish through a `publish/5.x.y` child. The back-merge to `main` then becomes a
**cherry-pick of the fix** (or a forward-port PR), not a merge, because the version policies have
diverged. Write the fix-forward PR in the same session as the hotfix so it is not forgotten.

## Automated publish (one action, no manual fix-ups)

Today the publish step is dispatched and then fixed up by hand — changelogs especially. The target is
**one dispatch that leaves nothing to fix**. The workflow, on `publish/<version>`:

1. **Guards** (fail loudly, before anything else):
   - stable and major run only on `refs/heads/publish/*`; alpha only on `refs/heads/prerelease`;
   - the `publish/*` branch must **equal** `origin/release/<n>` (not merely descend from it), the
     version policy's major must equal `<n>`, and the branch name must equal the policy version;
   - not every package may already be at the version on npm — a run that stopped part-way can be
     finished, and the publish job skips what npm already has;
   - if the version is older than npm's `latest` (a maintenance train), the run publishes under the
     dist-tag `release-<n>` instead of `latest`, and says so in the summary.
2. Verify change files, install, rebuild, run the tests (the stable path currently skips `rush test`),
   verify tarball exports.
3. **Version and changelogs in-workflow:** `rush version --bump` (or `rush publish --apply`) so the
   version policy, every `package.json`, `CHANGELOG.json` and `CHANGELOG.md` are written by the run, and
   the consumed `common/changes/` files are deleted by it. Resolve first: `publish-release-impl.yml`
   runs `rush publish --publish --include-all` **without `--apply`** while the alpha impl has it. Prove
   with a local dry run (`rush publish --apply --pack` on a throwaway clone) which flags produce
   5.1.0 versions, populated CHANGELOGs and deleted change files, then encode exactly that.

   **Proven 2026-11-14** (throwaway clone, no `--publish`; full table in
   `.ai/tasks/completed/2026-11/publish-workflow-rework/result.md`). `--include-all` ignores change
   files and `--apply` entirely — it publishes whatever `package.json` says — which is why the stable
   path never wrote changelogs. Plain `rush version --bump` always increments (5.1.0 → 5.2.0), and
   `rush publish --apply` without `--include-all` breaks lockstep (mixed 5.1.1 / 5.2.0). The encoded
   sequence treats **the policy version as the version to publish**:

   ```bash
   rush version --ensure-version-policy --version-policy base-utils --override-version <V>-0
   rush version --bump --version-policy base-utils --override-bump patch   # <V>-0 → <V>
   # commit, rebuild, test, verify tarballs, then per project: pnpm pack (what rush --pack runs)
   ```

   **As built, after two security-review rounds**, the run is three jobs so that no job holding npm
   or write credentials runs repository dependency code: `guard` (read-only, no secrets; also fixes
   the package list), `build` (read-only token, no OIDC: install → version → commit → rebuild → test
   → tarball check → `pnpm pack` per package, each tarball checked for `<V>` and no `workspace:`
   range, the tree checked clean → uploads tarballs and a `git bundle` of the bump commit), and
   `publish` (environment `npm-publish-release`, OIDC, write token, `persist-credentials: false`,
   installs nothing). `publish` trusts nothing from `build` until it has checked it: the bump commit
   must be one commit on the dispatched commit touching only `version-policies.json`, deletions under
   `common/changes/`, `package.json` and `CHANGELOG.json`/`.md` files, and the tarballs must be
   exactly the guard's package list. It then pushes the bump commit **first**, and per package runs
   `npm publish <tgz> --ignore-scripts` (skipping a version npm has) and pushes the annotated tag
   `<pkg>_v<V>` in rush's format; then a tag-count check and the PRs. Credentials are passed to `git
   push` only. **Alpha has the same three-job shape** (no bump commit: the build must have packed the
   dispatched commit; `--tag alpha`; tags `<pkg>_v<V>-alpha`; versions already on npm are skipped
   and not tagged, as rush did).

   Result on the 5.1.0 tree: policy and all 34 `base-utils` `package.json`s at 5.1.0, every
   `CHANGELOG.json`/`.md` gains a populated 5.1.0 section (32 CHANGELOG files created where none existed),
   771 change files deleted (the 20 left belong to projects with no version policy), policy
   `nextBump` unchanged. `--override-bump major` is no longer used: a major is a policy that says
   `<n>.0.0`. **Consequence:** the next stable publish needs a PR that moves the policy to the next
   version (`rush version --ensure-version-policy --version-policy base-utils --override-version
   <next>`); the npm guard refuses a forgotten one.
4. Commit the bump on `publish/<version>` and push it; publish; push per-package tags.
5. Open the PR `publish/<version>` → `release/<major>`, and once that merges, the back-merge PR
   `release/<major>` → `main` (or open both, the second drafted, if sequencing in one run is awkward).
6. Write a run summary (`$GITHUB_STEP_SUMMARY`): version, package list, PR links.

### Recovery

The bump commit is pushed before anything reaches npm, and a failed `publish` job uploads a `git
bundle` of the bump commit and any tags it made (artifact `recovery-<V>-attempt-<n>`).

- **`build` or `guard` failed** (flaky test, install): nothing was pushed or published. *Re-run
  failed jobs* or dispatch again.
- **`publish` failed** (npm, push, PR step): use **Re-run failed jobs — NOT "Re-run all jobs"**.
  Re-running all jobs rebuilds, and the new bump commit has a different SHA (CHANGELOG dates), so its
  push to `publish/<V>` is rejected as non-fast-forward: safe, nothing reaches npm, but it looks like
  a new failure. Re-run failed jobs re-runs only `publish`,
  reusing the `guard` outputs (version, dist-tag) and the `build` artifact (the same tarballs and bump
  commit) from the first attempt. The push is a no-op if the branch already has the commit, npm
  versions already published are skipped, existing tags are kept, the missing ones are made, and
  open PRs are reused. Do **not** dispatch a fresh run instead: the branch now holds the bump commit,
  so the exact-tip guard refuses it — by design, since a fresh run would rebuild and rewrite the
  CHANGELOG dates.
- **The push of the bump commit was rejected** (someone pushed to `publish/<V>` during the run):
  nothing reached npm. Reset `publish/<V>` to `release/<major>` (maintainer), dispatch again.
- **The build artifact is gone** (retention expired) **and** packages are partly on npm: reset
  `publish/<V>` to `release/<major>` and dispatch again. The guard allows a partial publish; the new
  run re-versions, skips the published packages, and creates only the missing tags. The guard allows
  this only when every package already on npm at `<V>` also has its `<pkg>_v<V>` tag on origin (the
  publish job pushes each tag right after its package), i.e. when it is a resume of this workflow's
  own run. Packages already published keep the first run's CHANGELOG date; their tags point at the
  first run's bump commit, which the recovery bundle preserves.
- **If *Re-run failed jobs* cannot download the first attempt's artifact** (see the pre-flight item
  below): treat it like the expired-artifact case above. The recovery bundle
  (`recovery-<V>-attempt-<n>`) holds the bump commit and the tags already pushed, so the first run's
  history is not lost; `git fetch <bundle> refs/heads/publish-bump` restores the commit locally.

**Changelog curation stays upstream of the workflow.** The release-prep stream rewrites each package's
pending change files into a few curated entries (with an "Upgrading from <previous>" note where the
release carries caveats). The workflow then renders those mechanically; there is nothing to edit after.

## Supply-chain pinning (applies to every workflow touched)

Recent supply-chain attacks have exploited mutable references in GitHub Actions. Audit 2026-11-14:
every `uses:` floats — `actions/checkout@v5`, `actions/setup-node@v5`, third-party
`snow-actions/git-config-user@v1.0.0` (a tag, mutable) — and the three publish impls run
`npm install -g npm@latest`. `dependabot.yml` covers `npm` only.

- [x] Pin **every** `uses:` to a full 40-character commit SHA with the version in a trailing comment
      (`uses: actions/checkout@<sha> # v5.x.y`). Resolve SHAs from the action's release tag at the
      time of the change and record the source.
- [x] Replace the third-party `snow-actions/git-config-user` with two `git config` lines in a `run:`
      step — it does nothing a shell line can't, and removes a third-party dependency from the publish
      path entirely.
- [x] Replace `npm install -g npm@latest` with an exact version (`npm@<x.y.z>`), bumped deliberately.
- [x] Add a `github-actions` ecosystem to `.github/dependabot.yml` so pinned SHAs get update PRs
      (dependabot updates SHA pins and their version comments).
- [x] Set top-level `permissions: contents: read` on every workflow and grant `contents: write`,
      `id-token: write`, `pull-requests: write` only on the publish jobs that need them. `ci.yml` has
      no `permissions` block today.
- [x] `actions/checkout`: `persist-credentials: false` on jobs that never push.
- [x] Keep Node pinned exactly (`24.15.0`), as today.
- [x] Optional: a CI check that fails on any `uses:` not pinned to a SHA (a short `grep` in `ci.yml`
      is enough), so the rule survives the next workflow edit.

## Phase 0 — Pre-flight

**Erik (GitHub settings — blocking):**
- [ ] `npm-publish-release` environment → deployment branches: allow the pattern `publish/*`.
- [ ] `npm-publish-alpha` → allow `prerelease` as a branch-**name** rule (survives recreation).
- [ ] Branch protection: `main` and `release/*` PR-only; `publish/*` writable by the workflow.
- [ ] Settings → Actions → General: **"Allow GitHub Actions to create and approve pull requests"**
      on, or the follow-up-PR step fails (403) after the packages are already published.
- [ ] Know that PRs opened with the job's `GITHUB_TOKEN` do not trigger `ci.yml`; push to the
      branch, or close and reopen the PR, to get checks on it (or switch the step to an App token).
- [ ] Before `publish/5.1.0`, dispatch **one alpha** as a smoke test: it runs the same
      guard / build / publish shape (pinned actions, `pnpm pack`, npm 11.21.2 publishing tarballs over
      OIDC) in the `npm-publish-alpha` environment. It does **not** cover the stable environment —
      see the next item.
- [ ] For **each** package's npm trusted-publisher entry, confirm it names **no environment**, or the
      environment the path uses: `npm-publish-release` for stable/major, `npm-publish-alpha` for
      alpha. An entry naming only one environment makes the other path fail at OIDC — after the alpha
      smoke test has passed.
- [ ] Prove that **Re-run failed jobs** lets `download-artifact` fetch the first attempt's artifact
      (a throwaway workflow: job A uploads, job B fails once, re-run B and see it download). Recovery
      rests on it; if it does not hold, the bundle-based fallback in *Recovery* is the path.
- [ ] Confirm npm trusted publishing (OIDC) is bound to repo + workflow file, not branch; verify on
      the first publish.

**Orchestrator/agent:**
- [x] The `--apply` dry run in *Automated publish* step 3.
- [ ] Reconcile root-tooling strays between `main` and `release` (the 2026-07 plan's Phase 2: root
      `package.json` / rush dependency, #464 deltas) so the drain merge is conflict-free.

## Phase 1 — Workflow rework (PR into the current `release` line, so it rides the drain)

- [x] `publish.yml` + impls per *Automated publish* (guards, test step, in-workflow version and
      changelog, child-branch commit, tags, follow-up PRs, summary).
- [x] `ci.yml` triggers: push `['main']`; pull_request `['main', 'release', 'release/**',
      'publish/**', 'prerelease', 'integration/**']` (`hotfix` dropped). `release` stays while the
      current PR flow still targets it and is dropped in Phase 4. Change-verify keys off `base_ref`.
- [x] Delete `publish-legacy.yml`, `publish-alpha-legacy.yml`, `publish-major-legacy.yml`; confirm
      nothing references `NPM_TOKEN`. (`publish-major-impl.yml` also deleted — `major` reuses the
      release impl. Neither publish path runs `rush publish` any more, so nothing reads
      `.npmrc-publish`; its token line is commented out.)
- [x] All *Supply-chain pinning* items.

## Phase 2 — The drain

- [ ] Land the 5.1.0 release-prep streams on `release` (sudoku extraction, release-compat, changelog
      curation, docs regeneration, this workflow rework) and Erik's testbed run.
- [ ] PR `release` → `main`, **merge commit**. Close #154 and #256 as obsolete.
- [ ] CI green on `main`; `rush install && rush rebuild` clean.

## Phase 3 — Create the train, publish 5.1.0

- [ ] Erik deletes `release` (agents never delete branches on origin). Archived history stays
      reachable through `main` and the per-package tags.
- [ ] Create `release/5` from `main` (the promotion), `publish/5.1.0` from `release/5`.
- [ ] Dispatch the stable publish on `publish/5.1.0`. Verify: versions 5.1.0, CHANGELOGs populated,
      change files consumed, tags pushed, npm `latest` = 5.1.0, both follow-up PRs opened.
- [ ] Merge `publish/5.1.0` → `release/5` (merge commit), then the back-merge → `main`. On this
      first run `release/5` has no commits ahead of `main`, so the workflow cannot open the draft
      back-merge PR; it prints a warning with the compare link — open it after the first merge.
- [ ] Recreate `prerelease` from `main` (only now) and set its policy to `5.2.0-0` / `nextBump:
      prerelease` (the stable publish leaves `5.1.0` / `minor`); confirm the next alpha is 5.2.0-N.
- [ ] PR to `main` moving the policy to the next stable version (`5.2.0`) so the next
      `publish/5.2.0` passes the branch-equals-policy guard.
- [ ] Bump `.ai/BASELINE.md`.

## Phase 4 — Docs sweep (PR → `main`)

- [ ] "Branch off / PR to `release`" → `main` across `CLAUDE.md`, `.ai/instructions/`,
      `.ai/conventions/workflow/` (notably `branch-buffer-and-promotion.md`, whose canonical/buffer
      framing changes), `.claude/agents/orchestrator.md`, `.claude/skills/`, handoff notes. Grep
      `release` in `.ai/` and `.claude/`.
- [ ] The "every touched package needs a change file" rule names `--target-branch origin/release`;
      update to `origin/main`.
- [ ] `LIBRARY_CAPABILITIES.md` and package `CAPABILITIES.md` links: `tree/release/...` →
      `tree/main/...` (the router's `Repository:` line too).
- [ ] Integration branches (`integration/*`) re-base on `main`.
- [ ] Drop `release` from `ci.yml`'s pull_request branches.

## Open questions

1. `hotfix` in CI triggers is dropped above; hotfixes are PRs into `release/<n>`. Confirm.
2. ~~Major releases: keep `--override-bump major`?~~ Resolved by the experiment: no. The `major`
   dispatch runs the same workflow as `release`, requires the policy to say `<n>.0.0`, and
   `release` refuses `<n>.0.0`.

## Superseded

The 2026-07-20 plan (main publishes stable; `published` pointer branch; `release` frozen) is replaced
by the model above. Its verified facts about root-tooling strays and the `--apply` discrepancy carry
forward into Phase 0.
