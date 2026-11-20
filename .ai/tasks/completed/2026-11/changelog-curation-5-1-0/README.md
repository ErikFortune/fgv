# changelog-curation-5-1-0 — curated 5.1.0 changelogs

**Shipped**: 2026-11-14 into `integration/asks` via #787. Change files only, for all 32 published
projects.

## Summary

5.1.0 is the first non-alpha release since 5.0.2, and Rush renders pending change files into each
package's changelog (shipped to npm as `CHANGELOG.json`). The 760 pending files were alpha-era,
stream-by-stream notes. They are replaced by 110 curated entries: for packages that were in 5.0.2,
what changed and an `Upgrading from 5.0.2:` note for every caveat the semver audit found; for new
packages, an initial-release bullet and their main capabilities. `result.md` carries the full
rendered text.

## What a reader should know

- **A change file's `type` is not inert here.** `rush version` renders by type (`major` →
  "Breaking changes", `minor` → "Minor changes", `patch` → "Patches", `none` → "Updates"), and
  `rush publish --apply` bumps per package by type. The release sequence
  (`--ensure-version-policy --override-version 5.1.0-0`, then `--bump --override-bump patch`)
  publishes everything at 5.1.0 regardless. `ACTIVE_DEVELOPMENT.md` still says otherwise; another
  stream corrects it.
- **Every 5.0.2 claim was checked against the published 5.0.2 tarballs**, not only `main`, which
  removed several alpha-era fixes that 5.0.2 never needed (`state.md` J4).
- **Unpublished projects carry no change files** — Rush never consumes them.

## Artifacts

`brief.md` (frozen contract), `state.md` (method and judgement calls), `result.md` (rendered
changelogs, counts, verification), `meta.yaml`.
