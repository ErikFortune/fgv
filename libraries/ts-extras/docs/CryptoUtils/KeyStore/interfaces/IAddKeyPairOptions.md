[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > IAddKeyPairOptions

# Interface: IAddKeyPairOptions

Options for adding an asymmetric keypair to the key store.

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

[algorithm](./IAddKeyPairOptions.algorithm.md)

</td><td>

`readonly`

</td><td>

[KeyPairAlgorithm](../../../type-aliases/KeyPairAlgorithm.md)

</td><td>

Algorithm to use for the new keypair.

</td></tr>
<tr><td>

[description](./IAddKeyPairOptions.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for the entry.

</td></tr>
<tr><td>

[replace](./IAddKeyPairOptions.replace.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to replace an existing entry with the same name.

</td></tr>
<tr><td>

[extractable](./IAddKeyPairOptions.extractable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Overrides the storage-backend-derived extractability for this key only.

</td></tr>
<tr><td>

[escrow](./IAddKeyPairOptions.escrow.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Opt in to private-key escrow.

</td></tr>
</tbody></table>
