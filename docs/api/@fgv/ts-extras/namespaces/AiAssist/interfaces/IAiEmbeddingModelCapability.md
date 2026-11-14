[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiEmbeddingModelCapability

# Interface: IAiEmbeddingModelCapability

Embedding capability for a model family within a provider. Used as an entry
in `embedding`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-defaultdimensions"></a> `defaultDimensions?` | `readonly` | `number` | Native fixed output dimension, when the model has one (metadata only). |
| <a id="property-format"></a> `format` | `readonly` | [`AiEmbeddingApiFormat`](../type-aliases/AiEmbeddingApiFormat.md) | API format used to dispatch requests for matching models. |
| <a id="property-maxbatchsize"></a> `maxBatchSize?` | `readonly` | `number` | Maximum number of inputs accepted per request. When present, the dispatcher rejects batches larger than this up front (no auto-chunking in v1). |
| <a id="property-modelprefix"></a> `modelPrefix` | `readonly` | `string` | Prefix matched against the resolved embedding model id. The empty string is the catch-all and matches every model. When multiple rules' prefixes match a model id, the longest prefix wins; ties are broken by first-encountered. |
| <a id="property-supportsdimensions"></a> `supportsDimensions?` | `readonly` | `boolean` | Whether matching models honor a requested output `dimensions` (OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001` via MRL truncation). When false/undefined, a caller-supplied `dimensions` is a no-op (logged, not failed — see [AiAssist.IAiEmbeddingParams](IAiEmbeddingParams.md)). |
| <a id="property-supportstasktype"></a> `supportsTaskType?` | `readonly` | `boolean` | Whether matching models honor a `taskType` hint (Gemini only today). When false/undefined, a caller-supplied `taskType` is a no-op (logged, not failed). |
