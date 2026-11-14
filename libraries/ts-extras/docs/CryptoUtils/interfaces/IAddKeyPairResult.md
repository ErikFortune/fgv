[Home](../../README.md) > [CryptoUtils](../README.md) > IAddKeyPairResult

# Interface: IAddKeyPairResult

Result of adding an asymmetric keypair to the key store.

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

[entry](./IAddKeyPairResult.entry.md)

</td><td>

`readonly`

</td><td>

[IKeyStoreAsymmetricEntry](../../interfaces/IKeyStoreAsymmetricEntry.md)

</td><td>

The asymmetric entry that was added.

</td></tr>
<tr><td>

[replaced](./IAddKeyPairResult.replaced.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this replaced an existing entry.

</td></tr>
<tr><td>

[warning](./IAddKeyPairResult.warning.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Best-effort warning from displaced-resource cleanup.

</td></tr>
</tbody></table>
