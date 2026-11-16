[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ISemanticRetrieverCreateParams

# Interface: ISemanticRetrieverCreateParams

Construction options for [SemanticRetriever.create](../classes/SemanticRetriever.md#create).

## Extends

- [`IRetrieverCreateParams`](IRetrieverCreateParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-backend"></a> `backend?` | `readonly` | [`ISemanticBackend`](ISemanticBackend.md) | The semantic backend. When absent, the retriever reports `supportsSemanticRecall: false` and a `query.semantic` request degrades loudly ([SEMANTIC\_UNWIRED\_MESSAGE](../variables/SEMANTIC_UNWIRED_MESSAGE.md)) rather than returning empty. |
| <a id="property-index"></a> `index` | `readonly` | [`IMemoryIndex`](IMemoryIndex.md) | The derived index to select over. |
| <a id="property-resolver"></a> `resolver` | `readonly` | [`IMemoryRecordResolver`](IMemoryRecordResolver.md) | Materializes the selected entries' bodies. |
