# private-key-storage

Closed the `IPrivateKeyStorage` implementation gap in the published fgv packages by
shipping the two backends the JSDoc promised but never delivered, plus the JSDoc fix.

- **`EncryptedFilePrivateKeyStorage`** (`@fgv/ts-extras/crypto-utils`) — directory-on-disk,
  one AES-256-GCM-encrypted JWK file per key, FileTree I/O, `supportsNonExtractable: false`.
- **`IdbPrivateKeyStorage`** (`@fgv/ts-web-extras/crypto-utils`) — IndexedDB, stores
  `CryptoKey` objects directly, `supportsNonExtractable: true`.
- JSDoc on `IPrivateKeyStorage` now points at the real impls (removed `@fgv/ts-chocolate`).

Origin: cross-repo gap surfaced 2026-05-28 by a personaility agent —
`KeyStore.addKeyPair` failed with `'No private key storage configured'` because ts-extras
shipped only the interface.

## Artifacts

- `brief.md` — the binding spec / locked design.
- `state.md` — phase status, decisions log, history.
- `result.md` — what shipped, signature deltas, gates, cross-repo handoff-back.

## Outcome

One implementation PR onto the `private-key-storage` integration branch (squashes to
`release` at close). Both impls satisfy `IPrivateKeyStorage` verbatim (interface unchanged),
100% test coverage in both packages, wired through `KeyStore.addKeyPair` end-to-end.
