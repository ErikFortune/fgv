[Home](../../README.md) > [AiAssist](../README.md) > IAiEmbeddingParams

# Interface: IAiEmbeddingParams

Parameters for an embedding request. Batch is the norm: `input` accepts a
single string or an array; the result always exposes a vector array aligned
by index to the input.

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

[input](./IAiEmbeddingParams.input.md)

</td><td>

`readonly`

</td><td>

string | readonly string[]

</td><td>

One or more input strings.

</td></tr>
<tr><td>

[dimensions](./IAiEmbeddingParams.dimensions.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Requested output dimensionality.

</td></tr>
<tr><td>

[taskType](./IAiEmbeddingParams.taskType.md)

</td><td>

`readonly`

</td><td>

[AiEmbeddingTaskType](../../type-aliases/AiEmbeddingTaskType.md)

</td><td>

Task-type hint.

</td></tr>
</tbody></table>
