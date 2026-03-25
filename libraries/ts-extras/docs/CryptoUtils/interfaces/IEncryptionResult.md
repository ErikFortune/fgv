[Home](../../README.md) > [CryptoUtils](../README.md) > IEncryptionResult

# Interface: IEncryptionResult

Result of an encryption operation.

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

[iv](./IEncryptionResult.iv.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

Initialization vector used for encryption (12 bytes for GCM).

</td></tr>
<tr><td>

[authTag](./IEncryptionResult.authTag.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

Authentication tag from GCM mode (16 bytes).

</td></tr>
<tr><td>

[encryptedData](./IEncryptionResult.encryptedData.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The encrypted data.

</td></tr>
</tbody></table>
