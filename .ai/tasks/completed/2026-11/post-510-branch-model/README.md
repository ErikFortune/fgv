# post-510-branch-model — the release flow after 5.1.0, and the docs that describe it

**Shipped**: 2026-11-20 on branch `post-510-branch-model` (based on `main` `3a541a89f`, carried
forward to `b91d01d39`), PR #802. Workflows, docs, 25 change files, and one URL constant in
`ts-app-shell`.

## Summary

5.1.0 was the first stable publish under the trunk-and-trains model (`main` trunk, `release/<major>`
trains, `publish/<version>` children). Three things were left over. The publish guard demanded that
the version policy *equal* the version being published, so every release needed a PR first that made
`main`'s policy claim an unpublished version; the guard now takes the version from the branch name
and requires it to be newer than the policy, which therefore stays honest. CI accepted any head into
a train; a `release-source` check (its own workflow, re-run on retarget) now fails a PR into
`release/*` unless it comes from `main` or `publish/<digit>…` in this repository. And every instruction still said to branch from and PR to the deleted
`release` branch; they now say `main`, and the branch-model convention describes the real topology.

## What a reader should know

- **`publish/<X.Y.Z>` is the version.** Strict `X.Y.Z`, newer than the train's policy and not older
  than the highest stable version on npm in its major (the policy lags npm until the publish PR
  merges), a major change only to `<n+1>.0.0`, `HEAD` exactly `origin/release/<X>`. Stable runs are
  serialized by one `publish-stable` concurrency group. Proven for 5.2.0, 5.1.1 and 6.0.0 on a
  scratch clone; seventeen refusal cases in `result.md`.
- **Change-file `type` is not inert.** It picks the CHANGELOG heading (Breaking changes / Minor
  changes / Patches / Updates), as the 5.1.0 CHANGELOGs show; `ACTIVE_DEVELOPMENT.md` now says so.
- **Erik still owns**: making `release-source` a required check on `release/*`, the first 5.2.0
  alpha (also the proof for setup-node v7 in the publish jobs), and the remaining Phase 0 settings.
- **Hotfixes into a diverged train** come from a `publish/5.x.y` branch — the only non-`main` head
  the new check admits.

## Artifacts

`brief.md` (the kickoff prompt plus the coordinator's mid-flight amendment), `result.md` (per-item
changes, scratch-clone evidence, setup-node v7 notes, gates, what was left alone), `meta.yaml`.
