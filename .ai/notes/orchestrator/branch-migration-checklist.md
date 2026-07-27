# Branch-migration checklist — `main` as trunk + `published` pointer

**Status: PLANNED — not started.** Drafted 2026-07-20 (orchestrator session, PR #566).
Prerequisite for publishing the accumulated `release` tranche (5.1.0). Come back here
when Erik has cycles for the settings-page items; everything else can be driven by an
orchestrator/agent session against this checklist.

## Target model (locked with Erik, 2026-07-20)

- **`main`** — the trunk. All feature PRs target it; CI push-gate runs on it; stable
  publishes dispatch from it. (Already the GitHub default branch, so dependabot,
  new-PR defaults, and badges become correct automatically at the drain.)
- **`published`** — new branch, a pointer to the last published-stable state. Written
  ONLY by the publish workflow (fast-forward after each stable/major publish). Enables
  hotfix-from-published if ever needed. Replaces the old rolling release→main PR (#154).
- **`prerelease`** — recreated off new `main` after the first stable publish; alpha
  publishes dispatch from it, exactly as today (bump commits stay off trunk).
- **`release`** — drained into `main`, then frozen; deleted after the docs sweep
  (open question 1 below).

## Facts verified at plan time (2026-07-20)

- `release` = de facto trunk: 40 rush projects (main has 20), lockstep 5.1.0
  unpublished (`version-policies.json` nextBump minor), **386 accumulated change files**
  in `common/changes/` that the stable publish will consume.
- `main` = 5.0.2 publish state + stray root-tooling commits (#238/#237-era, #464
  security sweep, #550 yaml 2.9.0). #545 (rush bump) was closed by dependabot as
  redundant after #550. `ts-utils-browser-test` (dropped by #464) is absent on BOTH
  branches — no resurrection risk in the drain.
- Known inconsistency: `release` root `package.json` has `@microsoft/rush ^5.172.1`
  while `rush.json` says 5.177.2; `main` root has `^5.175.1` → 5.177.2 lockfile.
- Workflows: `ci.yml` push-triggers on main only; PR-triggers on
  main/release/prerelease/hotfix (`hotfix` doesn't exist). `publish.yml` is a manual
  dispatch (release/alpha/major) running against the dispatched ref via
  `GITHUB_REF_NAME`; impls use OIDC environments `npm-publish-alpha` /
  `npm-publish-release`. Four `-legacy` workflows (NPM_TOKEN auth) still present.
  `publish-release-impl.yml` runs `rush publish --publish --include-all` **without**
  `--apply` (alpha impl has `--apply`) — see Phase 0 item 4.
- Per-package publish tags exist (e.g. `@fgv/typedoc-compact-theme_v5.1.0-9-alpha`),
  so commits on to-be-deleted branches stay reachable via tags.

---

## Phase 0 — Pre-flight verification

**Erik (settings pages — blocking):**
- [ ] `npm-publish-release` environment → Deployment branches rule: must allow `main`.
- [ ] `npm-publish-alpha` environment → Deployment branches rule: must allow
      `prerelease` (the recreated one — a branch-name rule survives recreation;
      a branch-ref rule may not).
- [ ] Branch protection on `main`: publish workflows push version-bump commits
      directly to the dispatch branch (`contents: write`). If main has/gets a
      required-PR rule, the workflow actor needs a bypass — confirm publish can push.
- [ ] Confirm npm trusted publishing (OIDC) config is repo+workflow-file bound (not
      branch bound) — expected to survive unchanged; verify on first publish.

**Orchestrator/agent:**
- [ ] Dry-run the stable publish semantics locally against a main-post-drain clone:
      `rush publish --apply --pack` (or the impl's exact flags) to confirm the 386
      change files + version policy produce the expected 5.1.0 versions/changelogs.
      Reconcile the `--apply` discrepancy between release-impl and alpha-impl before
      trusting the real dispatch.
- [ ] Diff #464's touched paths between `main` and `release` to enumerate exactly
      what the Phase 2 reconciliation PR must port (ajv CVE overrides, root deps).

## Phase 1 — Snapshot `published`

- [ ] `git branch published main && git push origin published` — BEFORE anything else
      touches main. (Current main = 5.0.2 published state + root-tooling strays that
      don't affect published package contents; honest enough as the pointer.)

## Phase 2 — Reconcile strays onto `release` (small PR → release)

- [ ] Align root `package.json`/`package-lock.json` with main's post-#550 state
      (yaml 2.9.0, rush dep — also fixes the ^5.172.1 vs 5.177.2 inconsistency).
- [ ] Port any #464 deltas not semantically present on release (from Phase 0 diff).
- [ ] Goal: `git merge main` into a release-based branch is conflict-free.

## Phase 3 — Workflow rework (PR → release, so it rides the drain)

- [ ] `ci.yml`: PR triggers → `['main', 'prerelease', 'published']` (drop `release`;
      drop or keep `hotfix`). Push triggers stay `['main']`. Change-verify logic needs
      no change (keys off `base_ref` / main).
- [ ] `publish.yml` impls: add branch guards — release + major jobs assert
      `github.ref == 'refs/heads/main'`; alpha asserts `refs/heads/prerelease`.
      Wrong-branch dispatch must fail loudly.
- [ ] `publish-release-impl.yml` (+ major impl): add post-publish step
      `git push origin HEAD:published` (fast-forward) after the publish commit lands.
- [ ] Delete `publish-legacy.yml`, `publish-alpha-legacy.yml`,
      `publish-major-legacy.yml` (and confirm nothing else references NPM_TOKEN).

## Phase 4 — The drain (release → main)

- [ ] Merge/close remaining release-targeting PRs first (#566 lessons sweep rides
      along if merged before the drain).
- [ ] Branch `merge/release-to-main` off release; `git merge main` (trivial after
      Phase 2); PR → main; **merge-commit, not squash** (179 commits of real stream
      history). CI change-verify passes because the change files are present.
- [ ] Close #154 (release→main) and #256 (prerelease→release) — obsolete.
- [ ] Sanity: CI green on main post-merge; `rush install && rush rebuild` clean.

## Phase 5 — First publish + recreate `prerelease`

**Order matters — stable publish FIRST, then recreate prerelease** (recreating first
would restart alphas at 5.1.0-0, colliding with the already-published 5.1.0-43 line):
- [ ] Dispatch `publish.yml` (release) from `main` → 5.1.0 ships; workflow
      fast-forwards `published` (verify) and tags.
- [ ] Verify version policy advanced (next alphas will be 5.2.0-N).
- [ ] `git branch -f prerelease main && git push -f origin prerelease`.
- [ ] Bump `.ai/BASELINE.md` to the 5.1.0 promotion commit.

## Phase 6 — Docs sweep (chore PR → main)

- [ ] Update "branch fresh off `release`" conventions → `main`: CLAUDE.md, `.ai/`
      instructions/conventions, `.claude/agents/orchestrator.md`, current handoff
      notes. (Grep for `release` in `.ai/` and `.claude/`.)
- [ ] `LIBRARY_CAPABILITIES.md`: bulk-update the dozens of
      `github.com/ErikFortune/fgv/tree/release/...` links → `/tree/main/...`.
- [ ] Keep frozen `release` alive until this merges (so links don't dangle), then
      resolve open question 1.

## Open questions

1. **Fate of `release` post-drain** — delete after the docs sweep, or keep frozen as
   an archival pointer? (Erik's call; tags keep everything reachable either way.)
2. `hotfix` in ci.yml PR triggers — drop, or formalize a hotfix-from-`published` flow?
3. Add a `.github/dependabot.yml` (explicit config, grouping, cadence) as part of
   Phase 3, or leave implicit security-only updates? (Post-drain, dependabot's
   default-branch targeting is correct either way.)

## Session context (for a cold pickup)

Plan drafted in the 2026-07-20 orchestrator session that also closed the N-Ask5
lessons inbox (#566) and triaged #493/#545/#550. Erik's framing: "switch to main as
trunk on the next major or minor release — but we've accumulated an awful lot in the
release branch," hence the drain-now shape rather than waiting. The rework is the
prerequisite for shipping the unpublished 5.1.0 tranche.
