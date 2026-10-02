# `ts-extras-browser-barrel-gaps`: `fromBase64Strict` in the browser entry, and a guard for the class

**Shipped 2026-10-02** via ErikFortune/fgv#715 (number anticipated; confirm at merge).

---

## What it is

Recovery-passphrase unlock failed in a browser with `CryptoUtils.fromBase64Strict is not a function`.
`@fgv/ts-web-extras` calls `fromBase64Strict` at two sites, and `@fgv/ts-extras`' browser `crypto-utils`
entry did not export it. The fix is one line. The rest of the stream is the guard.

## What changed shape

The brief expected a second, wider miss: that `CryptoUtils.Constants` was absent from the browser entry and
would break every AES path. Running the built browser entry showed otherwise. `Constants` arrives through
`export * from './model'`, and an AES-GCM round trip under the browser entry passes with `fromBase64Strict`
still removed. Only `fromBase64Strict` was missing.

## The guard

- `ts-extras`: the entry-point test now walks every namespace the Node entry exports and fails on any member
  the browser entry lacks, bar a commented Node-only allowlist (which is itself checked for staleness).
  The previous check compared top-level names only and passed with the defect in place.
- `ts-web-extras`: one suite runs `BrowserCryptoProvider` and `HttpTreeAccessors` against the built browser
  entry. Mapping the entire suite to the browser entry was tried and rejected, because eight tests compare
  against `NodeCryptoProvider`.

Reverting `fromBase64Strict` turns both red; reverting `deriveKeyPairFromSeed` turns guard (a) red.

## Files

- `brief.md`, `state.md`, `result.md`: the frozen brief, the working record, and the outcome with the revert
  matrix and gate counts.
- Code: `libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts`,
  `libraries/ts-extras/src/test/unit/index.browser.test.ts`,
  `libraries/ts-web-extras/src/test/unit/browserEntryResolution.test.ts`.

## Left open

Nine other packages with a browser entry still have no parity test (`docs/TECH_DEBT.md`, P2). The
PersonAIlity ask (#648) should be closed with the commit once this merges.
