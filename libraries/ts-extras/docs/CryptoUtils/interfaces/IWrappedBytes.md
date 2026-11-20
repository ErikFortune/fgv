[Home](../../README.md) > [CryptoUtils](../README.md) > IWrappedBytes

# Interface: IWrappedBytes

Output of CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes. The
shape is JSON-serializable so it can travel directly over the wire or be
persisted as-is.

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

[ephemeralPublicKey](./IWrappedBytes.ephemeralPublicKey.md)

</td><td>

`readonly`

</td><td>

JsonWebKey

</td><td>

Sender's ephemeral ECDH P-256 public key as a JSON Web Key.

</td></tr>
<tr><td>

[nonce](./IWrappedBytes.nonce.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

AES-GCM nonce, base64-encoded.

</td></tr>
<tr><td>

[ciphertext](./IWrappedBytes.ciphertext.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

AES-GCM ciphertext concatenated with the 16-byte authentication tag,
base64-encoded.

</td></tr>
</tbody></table>
