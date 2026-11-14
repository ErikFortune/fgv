# publish-workflow-rework — one dispatch publishes a stable release, with pinned actions

**Shipped**: 2026-11-14 on branch `publish-workflow-rework` (based on `branch-model-plan`, #784), PR
#TBD. No package changed; `.github/` and `common/config/rush/.npmrc-publish` only.

## Summary

The stable publish used to run `rush publish --publish --include-all`, which ignores change files:
it published whatever `package.json` said and never wrote a CHANGELOG, so every release was followed
by hand fix-ups. An experiment on a throwaway clone established the rush sequence that turns a tree
whose version policy says `<V>` into a published `<V>` with every CHANGELOG written from
`common/changes/` and the consumed change files deleted: park the policy on `<V>-0` with
`rush version --ensure-version-policy --override-version`, then `rush version --bump --override-bump
patch`. `publish-release-impl.yml` now runs that, guarded and tested, on a `publish/<version>`
branch, commits the bump, publishes, pushes tags, and opens the PR into `release/<major>` plus a
draft back-merge into `main`. The alpha path is unchanged apart from a `prerelease`-only guard.
Every action is pinned to a commit SHA and CI enforces it.

## What a reader should know

- **The version policy names the version the next stable publish produces**, and the branch must be
  `publish/<that version>`. After a publish the policy still says the published version, so the
  next release needs a PR that moves it; the npm guard refuses a forgotten one.
- **`rush publish --include-all` ignores `--apply` and change files**, and `rush publish`/`rush
  version --target-branch` push for real even without `--publish` — experiment on a clone whose
  `origin` is a scratch repo.
- **`major` is the same workflow** as `release`; it requires `<n>.0.0`. `--override-bump major` is
  gone (on a policy that already says `<n>.0.0` it would publish `<n+1>.0.0`).
- **Maintainer settings are prerequisites** — environment branch rules for `publish/*`, "allow
  Actions to create pull requests", push access to `publish/*`. Listed in `result.md` § "Needs the
  maintainer" and in the migration checklist's Phase 0.

## Artifacts

`brief.md` (frozen contract), `state.md` (judgement calls), `result.md` (experiment table, pins,
validation, maintainer items), `meta.yaml`.
