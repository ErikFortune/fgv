# deps-refresh — monorepo dependency refresh, security first

> Amended 2026-11-08 after review round 1. Corrections are inline, with the original wording in
> Appendix A.

**Shipped**: 2026-11-08 into `integration/asks` via #766.
Scope: the whole Rush monorepo: 38 projects touched, 35 of them published. Origin: a user request, after GitHub's
push response pointed at Dependabot alerts. Change files: 22 `patch`, 13 `none`.

## Summary

The **Rush lockfile** audit went from **173 advisories** (4 critical, 73 high, 84 moderate, 12 low) to
**3** (2 moderate, 1 low) ([A.1](#a1--the-audit-claim-covered-one-lockfile)). The root
`package-lock.json`, which is what Dependabot scans, went from 11 high to 1 high, which stays open
below `@microsoft/rush`. The autoinstaller lockfiles have no highs. Most of them were transitive versions pinned in the lockfile below what
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
  parents do not range it, and every pattern involved is repo-authored. `deepmerge` (low) has no
  fix published. `elliptic` was closed by removing an unused `crypto-browserify`
  ([A.2](#a2--elliptic-was-not-a-polyfill)). In the root lockfile, `@azure/msal-node` (high) needs a
  major below Rush's Azure cache plugin, which this repo does not load.
- **The MCP egress test now pins the package's own guard.** A same-origin 307 test goes red with
  `egress.ts`'s `redirect: 'error'` reverted.
- **Majors for the user to decide:** 22 rows with effort in `result.md` § 4d. One of them gates
  others: the Heft / private-members decision, which `eslint` 10 waits on. The Node floor
  (22.22 / 24.15) blocks none of them ([A.3](#a3--the-node-floor-was-misstated)).

## Artifacts

`brief.md` (frozen contract), `state.md` (decisions as they were made), `result.md` (before and
after audit tables, overrides, outdated and majors tables, source changes, release-age check,
gates), `meta.yaml`.

## Appendix A — corrections (2026-11-08)

### A.1 — the audit claim covered one lockfile

> The lockfile audit went from **173 advisories** (4 critical, 73 high, 84 moderate, 12 low) to
> **4** (2 moderate, 2 low).

True of `common/config/rush/pnpm-lock.yaml` only. The root `package-lock.json` (Dependabot's
target) and the three autoinstaller lockfiles had not been audited. They now are, in
`result.md` § 2c and § 2d, and the Rush lockfile count is now 3 after A.2.

### A.2 — elliptic was not a polyfill

> `deepmerge` and `elliptic` (low) have no fix published.

That is true, but it read as a reason to leave elliptic open. It came in only through
`crypto-browserify`, which both tools' webpack configs disable (`crypto: false`) and no source
imports. Removing it closed the advisory.

### A.3 — the Node floor was misstated

> Two of them gate others: the Heft / private-members decision, which `eslint` 10 waits on, and a
> Node-floor decision, because several majors need Node ≥22.

`rush.json` already requires `>=22.22.0 <23.0.0 || >=24.15.0 <25.0.0`, and CI runs 24.15.0. The
Node 20 floor came from a stale MONOREPO_GUIDE, which is corrected in this branch.

### Checked and unchanged

The Rush and pnpm versions, the two overrides, the release-age evidence, the Heft-hold reasoning,
the change-file split, and the forced `ts-extras-mcp` change.
