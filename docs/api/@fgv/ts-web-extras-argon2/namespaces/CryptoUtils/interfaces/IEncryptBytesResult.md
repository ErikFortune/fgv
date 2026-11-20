[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IEncryptBytesResult

# Interface: IEncryptBytesResult

Result of a raw-byte AES-256-GCM encryption via
[encryptBytes](ICryptoProvider.md#encryptbytes). The
authentication tag is returned separately from the ciphertext, mirroring the
separated-tag convention of [CryptoUtils.IEncryptionResult](IEncryptionResult.md). The exact
byte layout is:
- `ciphertext`: the AES-GCM ciphertext, byte-for-byte the same length as the
  input plaintext (GCM is a stream cipher — no padding). Empty plaintext
  yields an empty `ciphertext`.
- `authTag`: the 16-byte (128-bit) GCM authentication tag, computed over the
  ciphertext, the nonce, and any `aad`.

The caller persists both fields alongside the (caller-owned) nonce and feeds
them back to [decryptBytes](ICryptoProvider.md#decryptbytes).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-authtag"></a> `authTag` | `readonly` | `Uint8Array` | The 16-byte (128-bit) GCM authentication tag. |
| <a id="property-ciphertext"></a> `ciphertext` | `readonly` | `Uint8Array` | The AES-256-GCM ciphertext. Same length as the input plaintext (no tag appended — the tag is carried separately in the `authTag` field). |
