[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ISemanticBackend

# Interface: ISemanticBackend

The semantic backend wired into a [SemanticRetriever](../classes/SemanticRetriever.md): the vector index
to query and the embedder that turns the query text into a vector. Both are
required together — a vector index is useless without a way to embed the
query, so [SemanticRetriever.create](../classes/SemanticRetriever.md#create) treats them as one unit.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-embedquery"></a> `embedQuery` | `readonly` | [`QueryEmbedder`](../type-aliases/QueryEmbedder.md) | Turns the query text into a vector. |
| <a id="property-vectorindex"></a> `vectorIndex` | `readonly` | [`IVectorIndex`](IVectorIndex.md) | The vector index to query. |
