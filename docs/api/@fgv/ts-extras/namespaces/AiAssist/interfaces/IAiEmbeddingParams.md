[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiEmbeddingParams

# Interface: IAiEmbeddingParams

Parameters for an embedding request. Batch is the norm: `input` accepts a
single string or an array; the result always exposes a vector array aligned
by index to the input.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-dimensions"></a> `dimensions?` | `readonly` | `number` | Requested output dimensionality. Honored only by models whose capability declares `supportsDimensions` (OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001` via MRL truncation). Ignored — with a `logger.info` note — by models that don't. |
| <a id="property-input"></a> `input` | `readonly` | `string` \| readonly `string`[] | One or more input strings. A bare string is treated as a single-element batch. |
| <a id="property-tasktype"></a> `taskType?` | `readonly` | [`AiEmbeddingTaskType`](../type-aliases/AiEmbeddingTaskType.md) | Task-type hint. Mapped to Gemini `taskType`; a no-op (with a `logger.info` note) on OpenAI/Ollama/compat/Mistral. Preserves Gemini's query-vs-document retrieval asymmetry. |
