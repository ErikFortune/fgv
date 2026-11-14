[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IAddKeyPairOptions

# Interface: IAddKeyPairOptions

Options for adding an asymmetric keypair to the key store.

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | [`KeyPairAlgorithm`](../../../type-aliases/KeyPairAlgorithm.md) | `undefined` | Algorithm to use for the new keypair. |
| <a id="property-description"></a> `description?` | `readonly` | `string` | `undefined` | Optional description for the entry. |
| <a id="property-escrow"></a> `escrow?` | `readonly` | `boolean` | false — no escrow copy is written (today's behavior). SECURITY: escrow makes the master password the sole gate protecting a private key that would otherwise be unrecoverable from the vault. Use a strong KDF (Argon2id-derived or high-iteration PBKDF2) for escrow-bearing stores. See the CryptoUtils.KeyStore.KeyStore class docs. | Opt in to private-key escrow. When `true`, an encrypted copy of the private key (as a JWK) is carried inside the vault entry (`escrowedPrivateKeyJwk`), enabling cross-device recovery from the vault file plus the master password alone via `getKeyPair(name, { rehydrate: true })`. Orthogonal to `extractable`: the escrow copy is always captured (the transient keypair is generated extractable so it can be exported to JWK), while the LIVE stored key's extractability still follows the normal rule (`extractable` override, else the backend default). So escrow does not change how extractable the day-to-day key is — only whether a recovery copy is retained in the vault. |
| <a id="property-extractable"></a> `extractable?` | `readonly` | `boolean` | `undefined` | Overrides the storage-backend-derived extractability for this key only. Omit to keep the default (`!privateKeyStorage.supportsNonExtractable`). A value the backend cannot honor fails loudly rather than silently downgrading. |
| <a id="property-replace"></a> `replace?` | `readonly` | `boolean` | `undefined` | Whether to replace an existing entry with the same name. Replacement mints a fresh storage `id` and best-effort deletes the displaced storage blob; see the keystore design doc for details. |
