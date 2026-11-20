[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / CurrentValidRetriever

# Class: CurrentValidRetriever

Temporal retriever returning the **current** version of each temporal entity
matching the query (the newest version whose `invalid_at` is null/absent),
recency-ordered and limited. A fully-invalidated (soft-deleted) entity
contributes nothing. Non-temporal records are not this retriever's concern.

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`CurrentValidRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IRetrieverCreateParams`](../interfaces/IRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`CurrentValidRetriever`\>
