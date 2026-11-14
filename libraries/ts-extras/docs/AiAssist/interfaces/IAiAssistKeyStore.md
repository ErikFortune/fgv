[Home](../../README.md) > [AiAssist](../README.md) > IAiAssistKeyStore

# Interface: IAiAssistKeyStore

Minimal keystore interface for AI assist API key resolution.
Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.

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

[isUnlocked](./IAiAssistKeyStore.isUnlocked.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the keystore is currently unlocked

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

[hasSecret(name)](./IAiAssistKeyStore.hasSecret.md)

</td><td>



</td><td>

Check if a named secret exists

</td></tr>
<tr><td>

[getApiKey(name)](./IAiAssistKeyStore.getApiKey.md)

</td><td>



</td><td>

Get an API key by secret name

</td></tr>
</tbody></table>
