[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryClassifier

# Interface: IMemoryClassifier

Stage 2 — the host's classifier. Decides what [IIngestItem](IIngestItem.md) maps to
which memory [Kind](../type-aliases/Kind.md) (and optional tags / confidence). LOCKED as a
separate staged interface (OQ-10): the host plugs its existing classifier
machinery in here rather than surrendering to an opaque ingestor.

## Methods

### classify()

> **classify**(`item`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryClassification`](IMemoryClassification.md)\>\>

Classify one item. A `fail` aborts the item's ingest loudly (fgv never
guesses a kind).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`IIngestItem`](IIngestItem.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryClassification`](IMemoryClassification.md)\>\>
