[Home](../../README.md) > [CryptoUtils](../README.md) > IArgon2idKeyingOptions

# Interface: IArgon2idKeyingOptions

Optional keyed-hashing inputs for CryptoUtils.IArgon2idProvider.argon2id | argon2id
(RFC 9106 §3.1). These are distinct from the cost parameters in
CryptoUtils.IArgon2idParams — they change the derived output but are
not tuning knobs. Both fields are optional; omitting a field (or passing an
empty `Uint8Array`) is a no-op that leaves the output byte-identical to a call
with no options at all.

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

[secret](./IArgon2idKeyingOptions.secret.md)

</td><td>

`readonly`

</td><td>

Uint8Array&lt;ArrayBufferLike&gt;

</td><td>

Optional secret key K (RFC 9106 keyed hashing, sometimes called a "pepper").

</td></tr>
<tr><td>

[associatedData](./IArgon2idKeyingOptions.associatedData.md)

</td><td>

`readonly`

</td><td>

Uint8Array&lt;ArrayBufferLike&gt;

</td><td>

Optional associated data X (RFC 9106 §3.1).

</td></tr>
</tbody></table>
