[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentSemanticBackend

# Interface: IFragmentSemanticBackend

The fragment backend wired into a [FragmentSemanticRetriever](../classes/FragmentSemanticRetriever.md): the fragment
index to query and the embedder that turns the query text into a vector. Both are
required together — a fragment index is useless without a way to embed the query.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-embedquery"></a> `embedQuery` | `readonly` | [`QueryEmbedder`](../type-aliases/QueryEmbedder.md) | Turns the query text into a vector. |
| <a id="property-fragmentindex"></a> `fragmentIndex` | `readonly` | [`IFragmentVectorIndex`](IFragmentVectorIndex.md) | The fragment-granular vector index to query. |
