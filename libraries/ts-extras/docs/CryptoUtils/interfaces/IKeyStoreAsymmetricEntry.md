[Home](../../README.md) > [CryptoUtils](../README.md) > IKeyStoreAsymmetricEntry

# Interface: IKeyStoreAsymmetricEntry

An asymmetric keypair entry stored in the vault (in-memory representation).
Holds only the public key (as a JWK) and a stable handle (`id`) the
CryptoUtils.KeyStore.IPrivateKeyStorage provider uses to fetch the private key.

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

[name](./IKeyStoreAsymmetricEntry.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this entry (used as vault lookup key, renameable).

</td></tr>
<tr><td>

[type](./IKeyStoreAsymmetricEntry.type.md)

</td><td>

`readonly`

</td><td>

"asymmetric-keypair"

</td><td>

Asymmetric secret type discriminator.

</td></tr>
<tr><td>

[id](./IKeyStoreAsymmetricEntry.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Immutable handle used by CryptoUtils.KeyStore.IPrivateKeyStorage to address the
private key.

</td></tr>
<tr><td>

[algorithm](./IKeyStoreAsymmetricEntry.algorithm.md)

</td><td>

`readonly`

</td><td>

[KeyPairAlgorithm](../../type-aliases/KeyPairAlgorithm.md)

</td><td>

Algorithm used to generate this keypair.

</td></tr>
<tr><td>

[publicKeyJwk](./IKeyStoreAsymmetricEntry.publicKeyJwk.md)

</td><td>

`readonly`

</td><td>

JsonWebKey

</td><td>

The public key as a JSON Web Key.

</td></tr>
<tr><td>

[description](./IKeyStoreAsymmetricEntry.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for this entry.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreAsymmetricEntry.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this entry was added (ISO 8601).

</td></tr>
</tbody></table>
