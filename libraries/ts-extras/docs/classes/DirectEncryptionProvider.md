[Home](../README.md) > DirectEncryptionProvider

# Class: DirectEncryptionProvider

An IEncryptionProvider that uses a pre-supplied key and crypto provider.

This is useful when you have the raw encryption key from an external source
(e.g. a `SecretProvider` callback, password derivation, or a one-shot
operation) and don't want to open a full KeyStore.

Optionally bound to a specific secret name for safety: if a `boundSecretName`
is provided, calls to `encryptByName` with a different name will fail.

**Implements:** [`IEncryptionProvider`](../interfaces/IEncryptionProvider.md)

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

[boundSecretName](./DirectEncryptionProvider.boundSecretName.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

The secret name this provider is bound to, if any.

</td></tr>
</tbody></table>

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

[create(params)](./DirectEncryptionProvider.create.md)

</td><td>

`static`

</td><td>

Creates a new DirectEncryptionProvider.

</td></tr>
<tr><td>

[encryptByName(secretName, content, metadata)](./DirectEncryptionProvider.encryptByName.md)

</td><td>



</td><td>

Encrypts JSON content under a named secret.

</td></tr>
</tbody></table>
