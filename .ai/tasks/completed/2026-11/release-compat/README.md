# release-compat — 5.0.2 compatibility fixes before the 5.1.0 publish

**Shipped**: 2026-11-14 into `integration/asks` via #TBD.
Packages: `@fgv/ts-web-extras`, `@fgv/ts-res-browser`, `@fgv/ts-res-browser-cli` (change files
`patch`).

## Summary

A semver audit of `origin/main` (5.0.2) against `integration/asks` found two things a consumer on
`^5.0.2` would hit when 5.1.0 publishes non-alpha: `BrowserHashProvider` had stopped being a root
export of `@fgv/ts-web-extras` (#652 moved it under `CryptoUtils` with no change file), and the two
`ts-res-browser` tools published an `engines.node` range that excluded Node 23 and later.

Both are fixed. `BrowserHashProvider` is a root export again, as the same class as
`CryptoUtils.BrowserHashProvider`; the tools accept `>=22.22.0`.

## What a reader should know

- **The rest of the `ts-web-extras` root surface was checked against main** and is intact; only
  `FileApiTreeAccessors` differs (unused type parameter dropped — documented in the release notes,
  not restored — plus additive statics).
- **Other upper-bounded `engines` exist only on unpublished projects** (`@fgv/ks`, and private
  `ts-res-ui-playground`, `sudoku-app`, `testbed`); left as they are.

## Artifacts

`brief.md` (frozen contract), `state.md` (method and judgement calls), `result.md` (outcome and
gates), `meta.yaml`.
