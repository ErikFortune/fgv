[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IRetrieverCreateParams

# Interface: IRetrieverCreateParams

What every index-backed retriever needs: the index it selects over, and the
resolver it materializes survivors through.

## Remarks

The resolver is the whole of the partial-read migration for a caller that
constructs retrievers directly — the index projection itself is invisible to
anyone who only consumes `retrieve()`. `FileTreeMemoryStore` implements
[IMemoryRecordResolver](IMemoryRecordResolver.md), so wiring is `{ index, resolver: store }`.

## Extended by

- [`ISemanticRetrieverCreateParams`](ISemanticRetrieverCreateParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-index"></a> `index` | `readonly` | [`IMemoryIndex`](IMemoryIndex.md) | The derived index to select over. |
| <a id="property-resolver"></a> `resolver` | `readonly` | [`IMemoryRecordResolver`](IMemoryRecordResolver.md) | Materializes the selected entries' bodies. |
