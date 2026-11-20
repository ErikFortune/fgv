[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / RecencyRetriever

# Class: RecencyRetriever

Returns records matching the query's scope / kind / tag / provenance-source / predicate filters,
ordered most-recently-updated first. The universal v1 retriever — an empty
query returns the whole vault in recency order.

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`RecencyRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IRetrieverCreateParams`](../interfaces/IRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`RecencyRetriever`\>
