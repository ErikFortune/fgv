[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / IHpkeSealResult

# Interface: IHpkeSealResult

Output of [HpkeProvider.sealBase](../classes/HpkeProvider.md#sealbase).

The `ciphertext` field includes the 16-byte AES-256-GCM authentication tag
appended by Web Crypto's `encrypt()` operation: `length = plaintext.length + 16`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-ciphertext"></a> `ciphertext` | `readonly` | `Uint8Array` | AES-256-GCM ciphertext with the 16-byte authentication tag appended. Length = `plaintext.length + 16`. |
| <a id="property-enc"></a> `enc` | `readonly` | `Uint8Array` | Encapsulated key — 32-byte raw X25519 ephemeral public key (`enc` in RFC 9180). Must be transmitted to the recipient alongside `ciphertext`. |
