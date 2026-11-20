[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStoreFormat

# Type Alias: KeyStoreFormat

> **KeyStoreFormat** = `"keystore-v1"` \| `"keystore-v2"` \| `"keystore-v3"`

Format version for key store files.

- `'keystore-v1'`: the original format (no private-key escrow).
- `'keystore-v2'`: adds the optional `escrowedPrivateKeyJwk` field on
  asymmetric-keypair entries. A strict superset of v1 — the field is
  optional, so a v2 reader opens a v1 vault with no special-casing, and a
  v1 vault opened and re-saved is silently upgraded to v2.
- `'keystore-v3'`: adds the `'opaque'` symmetric secret type and the optional
  `metadata` / `updatedAt` fields on symmetric entries. A strict superset of
  v1/v2 — the additions are optional (and `'opaque'` is simply a new enum
  value), so a v3 reader opens a v1/v2 vault with no special-casing, and a
  v1/v2 vault opened and re-saved is silently upgraded to v3.
