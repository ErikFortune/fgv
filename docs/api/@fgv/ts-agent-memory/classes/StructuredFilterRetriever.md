[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / StructuredFilterRetriever

# Class: StructuredFilterRetriever

Returns records matching `query.filter` or `query.provenanceSource`, narrowed
by any scope / kind / tag / provenance-source pre-filter and recency-ordered.
Those two are this retriever's axes: a query carrying neither is not its
concern and yields an empty success (so it contributes nothing to a
[HybridRetriever](HybridRetriever.md), rather than failing).

Note `provenanceSource` appears on both sides of that sentence, and the
duplication is real rather than sloppy: it is one of this retriever's two
*dispatch* axes (it decides whether the query is this retriever's concern at
all) **and** a member of the shared *pre-filter* (it narrows the result set,
as it does for every other retriever). `filter` is likewise both.

## Remarks

`provenanceSource` is *applied* by the shared pre-filter, so every retriever
narrows by it. What this retriever adds is *answering* a query whose only axis
is `provenanceSource` — the "show me everything this source produced" request,
which would otherwise fall through the `filter`-absent guard and come back
empty.

Consequently, inside a [HybridRetriever](HybridRetriever.md) composed with the universal
[RecencyRetriever](RecencyRetriever.md), a `provenanceSource`-only query is answered by both
children and every matching record scores twice under a score-union merge.
That is the established behavior for a dedicated-axis retriever composed with
the universal one — [TagRetriever](TagRetriever.md) double-scores a `tag`-only query the
same way — and is intentional here, not an artifact of grafting a second axis
onto a retriever whose original concern was arbitrary predicates.

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`StructuredFilterRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IRetrieverCreateParams`](../interfaces/IRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`StructuredFilterRetriever`\>
