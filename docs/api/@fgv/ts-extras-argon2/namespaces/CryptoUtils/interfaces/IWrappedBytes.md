[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IWrappedBytes

# Interface: IWrappedBytes

Output of [wrapBytes](ICryptoProvider.md#wrapbytes). The
shape is JSON-serializable so it can travel directly over the wire or be
persisted as-is.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-ciphertext"></a> `ciphertext` | `readonly` | `string` | AES-GCM ciphertext concatenated with the 16-byte authentication tag, base64-encoded. Tampering with either the nonce or the ciphertext causes unwrap to fail GCM authentication. |
| <a id="property-ephemeralpublickey"></a> `ephemeralPublicKey` | `readonly` | `JsonWebKey` | Sender's ephemeral ECDH P-256 public key as a JSON Web Key. The matching ephemeral private key is dropped after the shared-secret derive. |
| <a id="property-nonce"></a> `nonce` | `readonly` | `string` | AES-GCM nonce, base64-encoded. 12 bytes (96 bits) — the standard AES-GCM nonce length. |
