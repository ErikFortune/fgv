[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / LinkTraversalRetriever

# Class: LinkTraversalRetriever

Breadth-first link-traversal retriever. From a scope-qualified
[IEdgeTarget](../interfaces/IEdgeTarget.md) seed it walks the link graph up to `query.hops` levels and
returns the records reached (excluding the seed), recency-ordered and limited.

## Remarks

- **Direction.** `linkedFrom` walks OUTBOUND edges (each record's
  `envelope.links[].target`); `linkedTo` walks INBOUND edges (the index's
  `backlinks`). Exactly one is the seed; `linkedFrom` wins if both are set.
- **Scope-qualified nodes.** Every graph node is an [IEdgeTarget](../interfaces/IEdgeTarget.md)
  `(scope, id)` pair, so following an edge to `turn-3` reaches ONLY the record
  in the edge's own scope — never a same-stem record in another scope.
- **Bound + cycle safety.** Traversal is bounded by `hops` (default `1` — a
  single hop) and a visited-set guard. Nodes are canonicalized to their
  `(scope, id)` string via [edgeTargetKey](../functions/edgeTargetKey.md), so a `Set<string>` visited-set
  is the exact, collision-free cycle key — no structural hashing (e.g.
  `Crc32Normalizer`) is needed. A self-loop or any multi-hop cycle terminates
  because a revisited node is never re-expanded.
- **Post-filter.** The scope / kind / tag / provenance-source / predicate axes of the query are
  applied to the reached records (the link axes are the traversal itself).

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

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`LinkTraversalRetriever`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IRetrieverCreateParams`](../interfaces/IRetrieverCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`LinkTraversalRetriever`\>
