# publish-workflow-rework — state (worker-owned)

## Checkpoint

- Experiment run on a throwaway clone with its `origin` pointed at a scratch bare repo (rush
  pushes for real even without `--publish`; see below). Results in `result.md`.
- Chosen stable sequence: `rush version --ensure-version-policy --version-policy base-utils
  --override-version <V>-0`, then `rush version --bump --version-policy base-utils --override-bump
  patch`, then `rush publish --publish --include-all ...`.

## Judgement calls

1. **The policy version is the version a stable publish produces.** The brief fixes the input as
   "policy and package.jsons say 5.1.0" and requires 5.1.0 out. Rush's own `--bump` always
   increments (5.1.0 → 5.2.0 / 5.1.1 / 6.0.0), so the workflow first parks the policy on `<V>-0`
   and then bumps `patch`, which semver turns into exactly `<V>` for any `X.Y.Z`. After the run the
   policy says `<V>` with `nextBump` unchanged — identical to before. The next stable publish needs
   a PR that sets the policy to the next version; the npm guard refuses a forgotten one.
2. **Branch name must equal the policy version.** Added as a guard (`publish/5.1.0` with policy
   `5.1.0`). Cheap, and it makes "what will this publish" readable from the branch list.
3. **`--override-bump major` dropped.** Under (1) a major is just a policy that says `<n>.0.0`;
   `--override-bump major` on such a tree would publish `<n+1>.0.0`. The `major` dispatch option
   remains and runs the same reusable workflow as `release`, with one extra guard: `major` requires
   `<n>.0.0`, `release` refuses it. `publish-major-impl.yml` is deleted (the caller, and therefore
   the npm trusted-publisher binding, stays `publish.yml`).
4. **`--apply` dropped from the stable `rush publish`.** With `--include-all` it is ignored (proved,
   C3). The alpha command is left byte-identical.
5. **`--set-access-level public` added to the stable `rush publish`** (alpha already has it); the
   exact command was dry-run in the experiment (C5c).
6. **`git commit --no-verify`** for the bump commit: `rush install` installs a pre-commit hook that
   runs `pretty-quick --staged`, which could reformat rush-written files between commit and pack.
   Mirrors the existing `--ignore-git-hooks`.
7. **Back-merge draft PR** cannot be created when `release/<major>` has no commits ahead of `main`
   (true on the very first publish, when `release/5` is freshly cut from `main`). The step then
   emits a warning and a compare link in the summary instead of failing the run.
8. **`common/config/rush/.npmrc-publish` `NPM_TOKEN` line commented out** — publishing is OIDC-only;
   the line was inert in CI (no workflow sets `NPM_TOKEN` once the legacy files are gone) but was the
   last token path. Maintainer may want it back for a local emergency publish.
9. **Publish jobs keep `persist-credentials` default (true)** because they push; only the guard job
   and `ci.yml` set it false. Deferring credentials until the push step would be stronger and is
   noted as a follow-up rather than done the night before the first publish.

## Open questions for the orchestrator

- `ACTIVE_DEVELOPMENT.md` § "What the `type` actually does" says lockstep entries all render under
  `### Updates`. The experiment shows `rush version --bump` renders `### Minor changes` /
  `### Patches` / `### Updates` by change-file type. Not in this stream's scope; flagged.

## Security review round (2026-11-14)

Orchestrator relayed an independent review (no P1s; P2-1..4, P3-1..9). All applied; details and
proofs in `result.md` § "Security review round". Judgement calls in that round:

10. **Full job split, not the fallback subset.** `pnpm pack` per project reproduces rush's `--pack`
    without passing `--publish` to rush, and could be proved locally, so the publish job installs no
    repository dependencies. Item 9 above (deferring credentials) is therefore done.
11. **Recovery is "Re-run failed jobs", not a fresh dispatch.** P2-1's exact-tip guard and P2-2's
    "re-run can finish a partial publish" pull against each other once the bump commit is pushed; the
    re-run path satisfies both (it reuses the build artifact), and a fresh dispatch after a reset is
    the documented last resort.
12. **Artifact actions** are the first Node 24 majors (upload v6.0.0, download v7.0.0), matching the
    Node 24 checkout/setup-node already pinned, rather than the Node 20 v4 line.
13. **`npm publish --ignore-scripts`** on the tarballs, so nothing from the package runs in the job
    that holds OIDC.

## Second review round (2026-11-14)

14. **Alpha's "diff allowlist"** has nothing to diff: alpha commits nothing. The equivalent check is
    that the build packed exactly the dispatched commit (empty diff) and that the tarballs equal the
    guard's package list.
15. **Alpha tags only what it publishes**, as `rush publish --include-all` did; a version already on
    npm is skipped untagged. Stable tags skipped versions when their tag is missing, because its
    resume rule depends on every published version being tagged.
16. **Per-package tag push** replaced the single batch push on stable, so a run that stops part-way
    leaves every published package tagged — which the narrowed resume guard requires.
17. **`rush change --verify` removed from both build jobs** (it compared each branch with itself).
