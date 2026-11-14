# release-compat — state

Worker-owned. Judgement calls and findings recorded here; the brief is not edited.

## Fix 1 — root `BrowserHashProvider`

- Root-surface diff method: extracted every root export name from `etc/ts-web-extras.api.md` on
  `origin/main` (5.0.2; 38 names incl. the 8 `FileSystem*_2 as …` aliases) and on this branch (49),
  then compared each common name's declaration block with comments stripped.
- Result: the only main root name absent at the branch root was `BrowserHashProvider`. Every other
  declaration is identical except `FileApiTreeAccessors`, which dropped its unused class type
  parameter and gained static methods (`createFromHttp`, `createFromLocalStorage`,
  `createPersistent`, `createPersistentFromFile`) — additive apart from the type parameter, which
  the brief says to leave. `FileTreeHelpers` is declared but not root-exported in both reports
  (identical body); nothing to restore.
- Restored with `export { BrowserHashProvider } from './packlets/crypto-utils';` in `src/index.ts`
  beside the `CryptoUtils` namespace. API report now shows `export class BrowserHashProvider`; no
  other line in the report changed.
- Test: added a `package root export` block to `browserHashProvider.test.ts` that imports the
  package root (`import * as Root from '../..'`, the same form `browserSaferFetch.test.ts` uses),
  asserts `Root.BrowserHashProvider` is `Root.CryptoUtils.BrowserHashProvider` (and the packlet
  class), and checks SHA-256("abc") against the FIPS 180-2 vector rather than against another call
  of the same function.

## Fix 2 — engines

- Every rush project with an `engines.node`: only `ts-res-browser` and `ts-res-browser-cli` are
  published (policy `base-utils`, `shouldPublish`). The same upper-bounded range also appears on
  `@fgv/ks` (no version policy, `shouldPublish: false`), and on `ts-res-ui-playground`,
  `sudoku-app`, `testbed` (all `private: true`). None is published, so per the brief they are left
  alone. Libraries carry no top-level `engines`; their `"node"` keys are `exports` conditions.
- `rush install` produced no lockfile change (engines is not a dependency field).

## Observations (not acted on)

- `libraries/ts-web-extras/src/test/unit/browserHashProvider.test.ts.bak` is a tracked stray file
  on the base. Out of scope; left in place.
- `ts-web-extras` branch coverage is 99.59% (package threshold 95%) — the gap is pre-existing in
  `httpTreeAccessors.ts` lines 61, 441, untouched by this stream. The new code is fully covered
  (`index.ts` is excluded from coverage by the package's jest config; the export is exercised by
  the new tests).
