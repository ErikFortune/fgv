[Home](../README.md) > IAiEmbeddingModelCapability

# Interface: IAiEmbeddingModelCapability

Embedding capability for a model family within a provider. Used as an entry
in `embedding`.

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

[modelPrefix](./IAiEmbeddingModelCapability.modelPrefix.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Prefix matched against the resolved embedding model id.

</td></tr>
<tr><td>

[format](./IAiEmbeddingModelCapability.format.md)

</td><td>

`readonly`

</td><td>

[AiEmbeddingApiFormat](../type-aliases/AiEmbeddingApiFormat.md)

</td><td>

API format used to dispatch requests for matching models.

</td></tr>
<tr><td>

[supportsDimensions](./IAiEmbeddingModelCapability.supportsDimensions.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether matching models honor a requested output `dimensions`
(OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001` via MRL
truncation).

</td></tr>
<tr><td>

[supportsTaskType](./IAiEmbeddingModelCapability.supportsTaskType.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether matching models honor a `taskType` hint (Gemini only today).

</td></tr>
<tr><td>

[defaultDimensions](./IAiEmbeddingModelCapability.defaultDimensions.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Native fixed output dimension, when the model has one (metadata only).

</td></tr>
<tr><td>

[maxBatchSize](./IAiEmbeddingModelCapability.maxBatchSize.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum number of inputs accepted per request.

</td></tr>
</tbody></table>
