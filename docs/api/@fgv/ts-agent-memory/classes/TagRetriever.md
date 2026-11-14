[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / TagRetriever

# Class: TagRetriever

Returns records carrying `query.tag`, recency-ordered within the tag and
narrowed by any scope / kind / provenance-source / predicate filters. Tag is this retriever's
axis: a query without a `tag` is not its concern and yields an empty success
(so it contributes nothing to a [HybridRetriever](HybridRetriever.md), rather than failing).

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TagRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IRetrieverCreateParams`](../interfaces/IRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TagRetriever`\>
