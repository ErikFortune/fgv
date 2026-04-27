[Home](../../README.md) > [CryptoUtils](../README.md) > IKeyStoreVaultContents

# Interface: IKeyStoreVaultContents

The decrypted vault contents - a versioned map of entries.

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

[version](./IKeyStoreVaultContents.version.md)

</td><td>

`readonly`

</td><td>

"keystore-v1"

</td><td>

Format version for vault contents.

</td></tr>
<tr><td>

[secrets](./IKeyStoreVaultContents.secrets.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, [IKeyStoreEntryJson](../../type-aliases/IKeyStoreEntryJson.md)&gt;

</td><td>

Map of entry name to entry (symmetric or asymmetric).

</td></tr>
</tbody></table>
