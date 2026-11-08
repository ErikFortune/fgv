# deps-refresh — monorepo dependency refresh, security first

**Shipped**: 2026-11-08 into `integration/asks` via #TBD.
Scope: the whole Rush monorepo: 38 projects touched, 35 of them published. Origin: a user request, after GitHub's
push response pointed at Dependabot alerts. Change files: 22 `patch`, 13 `none`.

## Summary

The lockfile audit went from **173 advisories** (4 critical, 73 high, 84 moderate, 12 low) to
**4** (2 moderate, 2 low). Most of them were transitive versions pinned in the lockfile below what
their parents already allowed, so one `rush update --full` closed the bulk. Six direct bumps,
which each raise a range or a floor, and two scoped `globalOverrides` closed the rest. Then 58
more direct ranges moved to the latest release in their current major that was at least two days
old. No major version was taken.

## What a reader should know

- **Rush 5.177.2 silently ignored `globalOverrides` under pnpm 11.** Rush 5.178 fixed this, so the
  bump to 5.182.1 was a precondition. On the old Rush, an override would have been accepted and
  never applied.
- **The Heft toolchain family is still on its 2026-09-14 pins.** The latest rigs fail
  `rush rebuild`: heft-lint-plugin 1.3 lints non-TS files, and `@rushstack/eslint-config` 4.9 warns
  on every `private _member`. The plugins pin `@rushstack/heft` exactly, so the family moves as one
  and is reported as an effective major (`result.md` § 4c, § 4d).
- **One forced source change**, in `ts-extras-mcp`. MCP SDK 1.32 defaults to following only
  same-origin redirects. A test control asserted the old platform behaviour, and two TSDoc passages
  and a README line described it. All of them were updated, and the package's static-header
  protection is unchanged. `rush rebuild` could not see this. The repo-wide `rush test` did.
- **Left open:** `glob` and `minimatch` (moderate). The fix is a major of a transitive whose
  parents do not range it, and every pattern involved is repo-authored. `deepmerge` and `elliptic`
  (low) have no fix published.
- **Majors for the user to decide:** 22 rows with effort in `result.md` § 4d. Two of them gate
  others: the Heft / private-members decision, which `eslint` 10 waits on, and a Node-floor
  decision, because several majors need Node ≥22.

## Artifacts

`brief.md` (frozen contract), `state.md` (decisions as they were made), `result.md` (before and
after audit tables, overrides, outdated and majors tables, source changes, release-age check,
gates), `meta.yaml`.
