[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / HybridRetriever

# Class: HybridRetriever

Composes several retrievers, dispatches a query to each, and merges their
results via an injectable [IMergeStrategy](../interfaces/IMergeStrategy.md). Its capabilities are the
union of the composed retrievers' capabilities.

## Remarks

The hybrid enforces the loud-degradation contract against its OWN (union)
capabilities, then projects the query for each child: a child that does not
support the `semantic` (or `asOf`) axis is handed a query with that axis
stripped, so it returns its normal results instead of loud-failing on a field
a sibling handles. A child that genuinely fails (e.g. a wired semantic backend
erroring) propagates — the hybrid never silently drops a failure.

## Implements

- [`IMemoryRetriever`](../interfaces/IMemoryRetriever.md)

## Accessors

### capabilities

#### Get Signature

> **get** **capabilities**(): [`IMemoryRetrieverCapabilities`](../interfaces/IMemoryRetrieverCapabilities.md)

The capabilities this retriever exposes. Probe before dispatch.

##### Returns

[`IMemoryRetrieverCapabilities`](../interfaces/IMemoryRetrieverCapabilities.md)

The capabilities this retriever exposes. Probe before dispatch.

#### Implementation of

[`IMemoryRetriever`](../interfaces/IMemoryRetriever.md).[`capabilities`](../interfaces/IMemoryRetriever.md#property-capabilities)

## Methods

### retrieve()

> **retrieve**(`query`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>\>

Retrieve records matching `query`. Returns a `Result.fail` with a
diagnostic message when the query requests a capability this retriever does
not support (never an empty success).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>\>

#### Implementation of

[`IMemoryRetriever`](../interfaces/IMemoryRetriever.md).[`retrieve`](../interfaces/IMemoryRetriever.md#retrieve)

***

### create()

> `static` **create**(`retrievers`, `mergeStrategy`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HybridRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `retrievers` | readonly [`IMemoryRetriever`](../interfaces/IMemoryRetriever.md)[] | The retrievers to compose (at least one). |
| `mergeStrategy` | [`IMergeStrategy`](../interfaces/IMergeStrategy.md) | How to combine their results. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`HybridRetriever`\>
