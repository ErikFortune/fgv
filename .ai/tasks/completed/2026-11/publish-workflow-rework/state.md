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
