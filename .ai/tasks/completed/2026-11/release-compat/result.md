# release-compat — result

**Shipped:** `BrowserHashProvider` is a root export of `@fgv/ts-web-extras` again, as it was in 5.0.2, beside `CryptoUtils.BrowserHashProvider` (the same class), and the published `engines.node` of `@fgv/ts-res-browser` and `@fgv/ts-res-browser-cli` is `>=22.22.0`, so Node 23 and later are no longer excluded.

## Fix 1 — `@fgv/ts-web-extras` root surface

- `src/index.ts`: `export { BrowserHashProvider } from './packlets/crypto-utils';` beside the
  `CryptoUtils` namespace, which is unchanged.
- `etc/ts-web-extras.api.md`: one line changed, `class BrowserHashProvider` →
  `export class BrowserHashProvider`.
- **Whole-surface diff against `origin/main` (5.0.2):** 38 root names on main, 49 on this branch.
  The only main name missing at the branch root was `BrowserHashProvider`. Comparing each common
  name's declaration block, everything is identical except `FileApiTreeAccessors` — the known
  unused-type-parameter drop the brief leaves to the release notes, plus four additive static
  methods. Method and details in `state.md`.
- Test (`browserHashProvider.test.ts`, "package root export"): the root export `toBe`
  `CryptoUtils.BrowserHashProvider` and the packlet class, and it hashes "abc" to the FIPS 180-2
  SHA-256 vector.
- Change file: `patch`, as briefed.

## Fix 2 — `engines.node`

- `tools/ts-res-browser/package.json`, `tools/ts-res-browser-cli/package.json`:
  `>=22.22.0 <23.0.0 || >=24.15.0 <25.0.0` → `>=22.22.0`. Change files `patch`, as briefed.
- **Other packages:** the same upper-bounded range is on `@fgv/ks` (no version policy,
  `shouldPublish: false`) and on the private `ts-res-ui-playground`, `sudoku-app` and `testbed`.
  None is published, so none was changed. No library declares top-level `engines`.
- `rush install` made no lockfile change.

## Gates

Run in the foreground from the worktree root on the work commit `884943f49`, via
`node common/scripts/install-run-rush.js`. Graded by grep, not exit code.

| gate | result | `not met\|Operations failed\|error TS\|Jest tests? failed\|ERR_PNPM` | `-i warning` |
|---|---|---|---|
| `install` | ok | 0 | 0 |
| `change --verify --target-branch origin/integration/asks` | 3 change files found | 0 | 0 |
| `rebuild` | SUCCESS: 39 operations | 0 | 1 (tracked-symlink only) |
| `lint` | SUCCESS: 34, NO OP: 5 | 0 | 1 (tracked-symlink only) |
| `test` | SUCCESS: 38, no work: 1 (`typedoc-compact-theme`) | 0 | 1 (tracked-symlink only) |

Logs NUL-free (byte counts match with and without NULs). `rushx fixlint` run in `ts-web-extras`
before the work commit; no changes. The close-out commit touches only Markdown/YAML under `.ai/`
and `docs/`.

## Not done / observations

- Tracked stray `libraries/ts-web-extras/src/test/unit/browserHashProvider.test.ts.bak` on the base;
  left alone (out of scope).
- `ts-web-extras` branch coverage 99.59% against a 95% package threshold — pre-existing gap in
  `httpTreeAccessors.ts`, untouched here.
- Ledger: added this stream's entry and index id only. The "N streams" / "N shipped" counts in
  `docs/workstreams/2026-11.md` and `docs/WORKSTREAMS.md` were deliberately **not** bumped, so the
  parallel `sudoku-extraction` edit merges mechanically; reconcile the counts at merge.
