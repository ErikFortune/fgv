[Home](../../README.md) > [CryptoUtils](../README.md) > IAddSecretFromPasswordResult

# Interface: IAddSecretFromPasswordResult

Result of adding a password-derived secret.
Extends IAddSecretResult with key derivation parameters
needed to store alongside encrypted files.

**Extends:** [`IAddSecretResult`](../../interfaces/IAddSecretResult.md)

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

[keyDerivation](./IAddSecretFromPasswordResult.keyDerivation.md)

</td><td>

`readonly`

</td><td>

[IKeyDerivationParams](../../interfaces/IKeyDerivationParams.md)

</td><td>

Key derivation parameters used to derive the secret key.

</td></tr>
<tr><td>

[entry](./IAddSecretResult.entry.md)

</td><td>

`readonly`

</td><td>

[IKeyStoreSymmetricEntry](../../interfaces/IKeyStoreSymmetricEntry.md)

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
