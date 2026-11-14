[Home](../../README.md) > [AiAssist](../README.md) > IAiMaxOutputTokensCapability

# Interface: IAiMaxOutputTokensCapability

Maximum output tokens for one model within a provider. Used as an entry in
`IAiProviderDescriptor.maxOutputTokens`.

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

[modelId](./IAiMaxOutputTokensCapability.modelId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The concrete model id this limit belongs to.

</td></tr>
<tr><td>

[maxOutputTokens](./IAiMaxOutputTokensCapability.maxOutputTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The largest `maxTokens` the provider accepts for a completion on this model.

</td></tr>
</tbody></table>
