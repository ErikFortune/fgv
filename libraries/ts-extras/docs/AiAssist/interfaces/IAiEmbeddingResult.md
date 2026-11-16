[Home](../../README.md) > [AiAssist](../README.md) > IAiEmbeddingResult

# Interface: IAiEmbeddingResult

Result of an embedding call. `vectors[i]` is the embedding for `input[i]`,
in request order.

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

[vectors](./IAiEmbeddingResult.vectors.md)

</td><td>

`readonly`

</td><td>

readonly (readonly number[])[]

</td><td>

One vector per input, aligned by index to the request order.

</td></tr>
<tr><td>

[model](./IAiEmbeddingResult.model.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The resolved provider-native model id that produced the vectors.

</td></tr>
<tr><td>

[dimensions](./IAiEmbeddingResult.dimensions.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Dimensionality of each returned vector (`vectors[0].length`; `0` for empty input).

</td></tr>
<tr><td>

[usage](./IAiEmbeddingResult.usage.md)

</td><td>

`readonly`

</td><td>

[IAiEmbeddingUsage](../../interfaces/IAiEmbeddingUsage.md)

</td><td>

Token usage, when the provider reports it (OpenAI-format; absent for Gemini).

</td></tr>
</tbody></table>
