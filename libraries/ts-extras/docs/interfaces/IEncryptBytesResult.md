[Home](../README.md) > IEncryptBytesResult

# Interface: IEncryptBytesResult

Result of a raw-byte AES-256-GCM encryption via
CryptoUtils.ICryptoProvider.encryptBytes | encryptBytes. The
authentication tag is returned separately from the ciphertext, mirroring the
separated-tag convention of CryptoUtils.IEncryptionResult. The exact
byte layout is:
- `ciphertext`: the AES-GCM ciphertext, byte-for-byte the same length as the
  input plaintext (GCM is a stream cipher — no padding). Empty plaintext
  yields an empty `ciphertext`.
- `authTag`: the 16-byte (128-bit) GCM authentication tag, computed over the
  ciphertext, the nonce, and any `aad`.

The caller persists both fields alongside the (caller-owned) nonce and feeds
them back to CryptoUtils.ICryptoProvider.decryptBytes | decryptBytes.

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

[ciphertext](./IEncryptBytesResult.ciphertext.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The AES-256-GCM ciphertext.

</td></tr>
<tr><td>

[authTag](./IEncryptBytesResult.authTag.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The 16-byte (128-bit) GCM authentication tag.

</td></tr>
</tbody></table>
