[Home](../README.md) > IAiStructuredOutputCapability

# Interface: IAiStructuredOutputCapability

Structured-output capability for a model family within a provider. Used as an
entry in `IAiProviderDescriptor.structuredOutput`.

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

[modelPrefix](./IAiStructuredOutputCapability.modelPrefix.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Prefix matched against the resolved completion model id.

</td></tr>
<tr><td>

[format](./IAiStructuredOutputCapability.format.md)

</td><td>

`readonly`

</td><td>

[AiStructuredOutputFormat](../type-aliases/AiStructuredOutputFormat.md)

</td><td>

Wire format used to express the constraint for matching models.

</td></tr>
</tbody></table>
