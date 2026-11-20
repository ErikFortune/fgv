[Home](../README.md) > IEncryptionProvider

# Interface: IEncryptionProvider

High-level interface for encrypting JSON content by secret name.

This abstraction unifies two common encryption workflows:
- **KeyStore**: looks up the named secret and crypto provider from the vault
- **DirectEncryptionProvider**: uses a pre-supplied key and crypto provider,
  optionally bound to a specific secret name for safety

Callers that need to encrypt (e.g. `EditableCollection.save()`) depend on
this interface rather than on `KeyStore` directly, allowing mix-and-match.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[encryptByName(secretName, content, metadata)](./IEncryptionProvider.encryptByName.md)

</td><td>



</td><td>

Encrypts JSON content under a named secret.

</td></tr>
</tbody></table>
