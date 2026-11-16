[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / SemanticRetriever

# Class: SemanticRetriever

Vector-recall retriever. When a [backend](../interfaces/ISemanticBackend.md) is wired it
embeds `query.semantic`, queries the vector index, and resolves the hits back
to records (preserving vector score order). When no backend is wired,
`supportsSemanticRecall` is `false` and any `query.semantic` request degrades
loudly — it NEVER returns a silent empty.

## Remarks

A consumer-supplied backend that rejects (throws) is normalized into a
`Failure` — `retrieve` always honors its `Promise<Result<...>>` contract.

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SemanticRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ISemanticRetrieverCreateParams`](../interfaces/ISemanticRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SemanticRetriever`\>
