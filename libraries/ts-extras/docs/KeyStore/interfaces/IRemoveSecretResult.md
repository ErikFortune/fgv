[Home](../../README.md) > [KeyStore](../README.md) > IRemoveSecretResult

# Interface: IRemoveSecretResult

Result of removing a secret from the key store.

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

[entry](./IRemoveSecretResult.entry.md)

</td><td>

`readonly`

</td><td>

[IKeyStoreEntry](../../type-aliases/IKeyStoreEntry.md)

</td><td>

The secret entry that was removed from the vault.

</td></tr>
<tr><td>

[warning](./IRemoveSecretResult.warning.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Best-effort warning from CryptoUtils.KeyStore.IPrivateKeyStorage.delete
for asymmetric entries when the storage call failed.

</td></tr>
</tbody></table>
