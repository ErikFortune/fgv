# Result — `ts-extras-browser-barrel-gaps`

**Shipped:** `@fgv/ts-extras`' browser `crypto-utils` entry now exports `fromBase64Strict`, and a guard fails
if the Node entry exports a namespace member the browser entry lacks. The `Constants` half of the ask was
not a defect.

## What shipped

- `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts`: one line, `fromBase64Strict`.
  `fromBase64Strict` is a pure `atob` helper, so it is browser-safe. `etc/*.api.md` did not move
  (api-extractor reads the Node entry).
- Guard (a): `libraries/ts-extras/src/test/unit/index.browser.test.ts` gained a recursive namespace-member
  parity test with a commented Node-only allowlist (7 entries) and a staleness check on the allowlist.
- Guard (b), narrowed: `libraries/ts-web-extras/src/test/unit/browserEntryResolution.test.ts` loads
  `BrowserCryptoProvider` and `HttpTreeAccessors` against the built browser entry
  (`jest.doMock('@fgv/ts-extras', ...)`): an AES-GCM round trip, `fromBase64` success and failure, and a
  base64 HTTP storage response.
- Change files: `@fgv/ts-extras` `patch`, `@fgv/ts-web-extras` `none` (tests only). No `ts-web-extras` source
  changed.
- `docs/TECH_DEBT.md` P2 entry amended to say what is now covered and what is not. Not retired.

## Verdicts on the brief's beliefs

1. **`fromBase64Strict` missing: confirmed.** `require('lib/packlets/crypto-utils/index.browser.js')`
   gives `typeof fromBase64Strict === 'undefined'`. Two call sites, as stated
   (`browserCryptoProvider.ts:354`, `httpTreeAccessors.ts:471`).
2. **`Constants` breaks every AES path: refuted, by running it.** Against the built browser barrel,
   `typeof Constants === 'object'` with all five keys, and `typeof CryptoUtils.Constants === 'object'` via
   the root browser entry. Cause: `model.ts` does `export { Constants }` and the browser barrel has
   `export * from './model'`, so the namespace arrives through the model re-export. With
   `fromBase64Strict` removed, the AES-GCM round-trip test in the browser-entry suite still passes and only
   the two `fromBase64Strict` tests fail. The requester's "(and check `Constants`)" was a hedge; the answer
   is that it is fine. The brief's reading of lines 30-37 missed the `export * from './model'` above them.
3. **Why nothing caught it: confirmed, with a refinement.** Types come from the Node `.d.ts`, and under
   Jest `@fgv/ts-extras` resolves to the Node entry (the pre-fix `ts-web-extras` suite passed with the miss
   in place; re-run with the line reverted: the existing 545 tests pass, only the new suite fails). Mapping the whole suite to the browser entry produces 25 `fromBase64Strict is not a function` log lines across
   failing suites.
4. **Existing parity guard compared top-level names only: confirmed.** With the fix reverted, 4 of its 5
   tests (including the old top-level one) still passed.
5. **Only two runtime misses: confirmed, same two sites.** Re-swept with a TypeScript AST walk (value
   positions, non-test source), checked against the built browser entry. `CryptoUtils.fromBase64Strict` is
   the only miss. The brief's other findings hold (`NodeCryptoProvider` etc. appear only in TSDoc).
   `SaferFetch` use in `ts-web-extras` (`saferFetchBytes/Json/Text`) resolves.

## Guard: chosen and rejected

- **(a) chosen.** Catches the class at the source for every consumer, costs about 50 lines, needs no build
  ordering. A generic Node-vs-browser diff over the namespaces found exactly the Node-only allowlist plus
  `fromBase64Strict`; the allowlist (`NodeCryptoProvider`, `nodeCryptoProvider`,
  `KeyStore.EncryptedFilePrivateKeyStorage`, `Csv.readCsvFileSync`, `RecordJar.readRecordJarFileSync`,
  `SaferFetch.blockPrivateNetworks`, `SaferFetch.nodeHostResolver`) was derived from that diff and each
  entry checked against its barrel's own comment. Recursion is unbounded through namespaces (so `KeyStore`
  and `Constants` are walked). It does not look inside classes.
- **(b) as briefed, rejected as permanent config.** Feasible and decisive (it fails on today's
  `release`), but 8 tests compare against `NodeCryptoProvider` and fail under the mapping. **Kept in
  narrowed form** as one suite using `jest.doMock`, because it is the only thing that runs the real call
  sites, and it covers the `Constants` question by execution. It relies on the sibling's built
  `lib/index.browser.js` and a relative path to it, which is fragile; ts-extras builds before
  ts-web-extras in Rush, and a break there is loud (module not found).
- **(c) rejected.** Source scanning, one access shape, and (a) already covers the same ground without it.
- **(d) rejected.** Heavier than the class warrants.

## Revert matrix (guard seen to fail)

| revert | guard (a), ts-extras | suite (b), ts-web-extras |
|---|---|---|
| remove `fromBase64Strict` from `index.browser.ts` | red: `+ "CryptoUtils.fromBase64Strict"` (1 failed, 4 passed) | red: 2 failed (`fromBase64`, HTTP base64), AES test passed |
| remove `deriveKeyPairFromSeed` export | red: `+ "CryptoUtils.deriveKeyPairFromSeed"` (1 failed, 4 passed) | not exercised (no test touches seed derivation); (a) alone catches it |

The only barrel line this stream added is `fromBase64Strict`. `Constants` was not a miss, so there was
no `Constants` line to revert; `deriveKeyPairFromSeed` was reverted as a second, independent line to
show the guard is not specific to the one defect.

## Gate output (grep counts over logs, `-i` for warnings)

`ts-extras`: build, lint, test exit 0; errors 0, warnings 0; coverage 100/100/100/100.
`ts-web-extras`: build, lint, test exit 0; errors 0; `grep -ci warning` is 1 per build/test log, and both
hits are the command line `--disable-warning=DEP0040`, not a warning. Coverage 100 / 99.58 branch / 100 /
100 (branch threshold is 95; 99.58 was the figure before this stream).
`rush change --verify --target-branch origin/release`: exit 0. `fixlint` run in both packages, no diff.

## Anything the brief got wrong

- Belief 2 (above).
- "`rushx` may be missing": it is, use `install-run-rushx.js`.
- The worktree was created at `c20ae3a8`, not the stated base, and had no brief until reset.
- The brief says the browser `.d.ts` rollup is out of scope. It bears on this: a typed browser entry would
  have made `CryptoUtils.fromBase64Strict` a compile error in `ts-web-extras`. Guard (a) is a runtime
  substitute for that, not a replacement.

## Not done

- `personality-intake`'s #648 inbox file is not dispositioned (it sits under `completed/`).
- Nine other packages with browser entries still have no parity test.
