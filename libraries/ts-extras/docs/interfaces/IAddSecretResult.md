[Home](../README.md) > IAddSecretResult

# Interface: IAddSecretResult

Result of adding a secret to the key store.

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

[entry](./IAddSecretResult.entry.md)

</td><td>

`readonly`

</td><td>

[IKeyStoreSymmetricEntry](IKeyStoreSymmetricEntry.md)

</td><td>

The secret entry that was added.

</td></tr>
<tr><td>

[replaced](./IAddSecretResult.replaced.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this replaced an existing secret.

</td></tr>
<tr><td>

[warning](./IAddSecretResult.warning.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Best-effort warning from displaced-resource cleanup.

</td></tr>
</tbody></table>
