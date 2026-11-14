[Home](../../README.md) > [AiAssist](../README.md) > IAiCompletionResponse

# Interface: IAiCompletionResponse

Result of an AI provider completion call.

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

[content](./IAiCompletionResponse.content.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The generated text content

</td></tr>
<tr><td>

[truncated](./IAiCompletionResponse.truncated.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the response was truncated due to token limits

</td></tr>
<tr><td>

[structuredOutput](./IAiCompletionResponse.structuredOutput.md)

</td><td>

`readonly`

</td><td>

[StructuredOutputEnforcement](../../type-aliases/StructuredOutputEnforcement.md)

</td><td>

Which structured-output constraint the provider was **asked** to apply.

</td></tr>
<tr><td>

[usage](./IAiCompletionResponse.usage.md)

</td><td>

`readonly`

</td><td>

[IAiCompletionUsage](../../interfaces/IAiCompletionUsage.md)

</td><td>

Token usage, when the provider reports it.

</td></tr>
</tbody></table>
