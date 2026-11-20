[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IVectorRebuildOptions

# Interface: IVectorRebuildOptions

Options for a vector-index rebuild.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-onrecorderror"></a> `onRecordError?` | `readonly` | [`VectorRebuildErrorMode`](../type-aliases/VectorRebuildErrorMode.md) | How to treat a record the rebuild cannot index — an embed failure OR an add failure. Defaults to `'fail'` — the historical behavior, unchanged for every existing caller. |
