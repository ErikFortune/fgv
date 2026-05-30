[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > IKeyStoreAsymmetricEntryJson

# Interface: IKeyStoreAsymmetricEntryJson

JSON-serializable representation of an asymmetric keypair entry.
The private key is not present here — it lives in the
CryptoUtils.KeyStore.IPrivateKeyStorage provider, addressed by `id`.

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

[name](./IKeyStoreAsymmetricEntryJson.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this entry.

</td></tr>
<tr><td>

[type](./IKeyStoreAsymmetricEntryJson.type.md)

</td><td>

`readonly`

</td><td>

"asymmetric-keypair"

</td><td>

Asymmetric secret type discriminator.

</td></tr>
<tr><td>

[id](./IKeyStoreAsymmetricEntryJson.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Immutable handle used by CryptoUtils.KeyStore.IPrivateKeyStorage to address the

</td></tr>
<tr><td>

[algorithm](./IKeyStoreAsymmetricEntryJson.algorithm.md)

</td><td>

`readonly`

</td><td>

[KeyPairAlgorithm](../../../type-aliases/KeyPairAlgorithm.md)

</td><td>

Algorithm used to generate this keypair.

</td></tr>
<tr><td>

[publicKeyJwk](./IKeyStoreAsymmetricEntryJson.publicKeyJwk.md)

</td><td>

`readonly`

</td><td>

JsonWebKey

</td><td>

The public key as a JSON Web Key.

</td></tr>
<tr><td>

[description](./IKeyStoreAsymmetricEntryJson.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreAsymmetricEntryJson.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this entry was added (ISO 8601).

</td></tr>
</tbody></table>
