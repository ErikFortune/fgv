[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryRetrieverCapabilities

# Interface: IMemoryRetrieverCapabilities

The capabilities a retriever exposes. A consumer probes these before
dispatching a query so it never silently gets an empty result for a
capability the retriever does not implement.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-supportslinktraversal"></a> `supportsLinkTraversal` | `readonly` | `boolean` | Link traversal is supported (an in-memory backlink index is present). |
| <a id="property-supportssemanticrecall"></a> `supportsSemanticRecall` | `readonly` | `boolean` | Semantic / vector recall is operational (an [IVectorIndex](IVectorIndex.md) is wired). |
| <a id="property-supportstemporalquery"></a> `supportsTemporalQuery` | `readonly` | `boolean` | Temporal "as-of" queries are operational (a temporal index is wired). |
