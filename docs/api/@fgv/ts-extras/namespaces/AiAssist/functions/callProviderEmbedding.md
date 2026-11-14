[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProviderEmbedding

# Function: callProviderEmbedding()

> **callProviderEmbedding**(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiEmbeddingResult`](../interfaces/IAiEmbeddingResult.md)\>\>

Calls the appropriate embedding API for a given provider. Routes by the
`format` of the resolved [AiAssist.IAiEmbeddingModelCapability](../interfaces/IAiEmbeddingModelCapability.md):
`'openai-embeddings'` or `'gemini-embeddings'`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IProviderEmbeddingParams`](../interfaces/IProviderEmbeddingParams.md) | Request parameters including descriptor, API key, and input. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiEmbeddingResult`](../interfaces/IAiEmbeddingResult.md)\>\>

The embedding vectors aligned to input order, or a failure.

## Remarks

- Rejects up front when the provider declares no embedding capability, when no
  embedding model resolves, or when the batch exceeds the capability's
  `maxBatchSize` (no auto-chunking).
- An empty `input` array short-circuits to an empty result with no wire call
  (most providers HTTP-400 on empty input).
- Caller-supplied `dimensions`/`taskType` that the model doesn't support are a
  no-op (logged), not a failure (design §7).
