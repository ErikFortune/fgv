[Home](../../README.md) > [CryptoUtils](../README.md) > IHpkeSealResult

# Interface: IHpkeSealResult

Output of HpkeProvider.sealBase.

The `ciphertext` field includes the 16-byte AES-256-GCM authentication tag
appended by Web Crypto's `encrypt()` operation: `length = plaintext.length + 16`.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[enc](./IHpkeSealResult.enc.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

Encapsulated key — 32-byte raw X25519 ephemeral public key (`enc` in RFC 9180).

</td></tr>
<tr><td>

[ciphertext](./IHpkeSealResult.ciphertext.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

AES-256-GCM ciphertext with the 16-byte authentication tag appended.

</td></tr>
</tbody></table>
