# chores-2026-10-asks-hmac-compositeid — HMAC keys from the provider; composite ids that can contain their separator

**Shipped**: 2026-10-26 into `integration/asks` via #TBD.
- **Packages:** `@fgv/ts-extras` (`crypto-utils`), `@fgv/ts-web-extras` (`crypto-utils`) and `@fgv/ts-utils` (`conversion`, `validation`).
- **Origin:** personaility#692 and #693 (fgv-asks).
- **Shape:** a chore batch of two items, shipped as one PR with one commit per item.

## Summary

**#692.** `hmacSha256` and `verifyHmacSha256` accept only a `CryptoKey`, but `ICryptoProvider` had
no way to make one. Its own doc told callers to use `crypto.subtle.importKey`, which is exactly the
bypass the provider exists to close. The interface now has two new members:
- `generateHmacKey(options?)` makes a fresh 256-bit key.
- `importHmacKey(raw, options?)` imports raw bytes and refuses fewer than 32.

Both return HMAC-SHA256 keys with usages `sign` and `verify`, and both are non-extractable unless
`{ extractable: true }`. Both providers implement them. The existing key parameter was deliberately
**not** widened to accept raw bytes.

**#693.** `compositeIdFromString`, `compositeId` and `CompositeIdValidator` took no options and
failed on any second separator. They now take `split: 'exact' | 'first' | 'last'`:
- `'exact'` is the default and keeps the old behaviour.
- `'first'` and `'last'` pass the remainder, separator and all, to the item or collection part.

The misplaced period in the error message (`':.'`) is fixed in both places.

## What a reader should know

- **The `ICryptoProvider` change breaks implementers, not callers.**
  - The change file is `minor`, prefixed `BREAKING (implementers only):`, on both packages.
  - The sweep found only the two real providers: no subclasses and no structural doubles.
- **`deriveKey` output goes through `importHmacKey`.** The old doc implied PBKDF2 produced a
  `CryptoKey`. It does not: `deriveKey` returns a `Uint8Array`.
- **The composite-id split helper is duplicated on purpose.** Each of the two files has a
  module-private copy. Sharing one across the packlet boundary would have made it public API on an
  established surface.
- **Nested composites:** split with `'first'` or `'last'`, validate the part as a plain string, then
  re-parse it. The pattern is documented on `CompositeIdSplitMode` and in `ts-utils/CAPABILITIES.md`,
  and a test pins it.

## Artifacts

| file | contents |
|---|---|
| `brief.md` | The frozen contract. |
| `result.md` | Per-item change lists, the implementer and downstream sweeps, tests, gate results and observations. |
| `state.md` | The worker's checkpoint and design notes. |
| `meta.yaml` | The index record. |
