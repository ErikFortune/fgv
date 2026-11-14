[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / scopedAddressOf

# Function: scopedAddressOf()

> **scopedAddressOf**(`record`, `resolver`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>

The scope-qualified `(scope, id)` address of a loaded record: the scope its kind's
codec derives from `(kind, entityId)`, paired with the record's own
[id](../interfaces/IMemoryEnvelope.md#property-id).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> | The record to address. |
| `resolver` | [`IIdentityResolver`](../interfaces/IIdentityResolver.md) | Resolves `(kind, entityId)` to the record's storage scope. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>

`Success` with the address, or the resolver's `Failure` (no codec for
the kind, or a codec that rejects the entity id) unformatted, for the caller to
contextualize.

## Remarks

A bare `id` is unique only within a scope (the MTM codec mints `turn-<n>` under
every conversation), so anything that asks "is this the same record?" of records
from more than one scope has to key on this address, through
[edgeTargetKey](edgeTargetKey.md). For a versioned kind the `id` is the version stem, so
distinct versions of one entity have distinct addresses.

For every record `FileTreeMemoryStore` returns, the result is the address the
record was **read from**: the store refuses to load a record from any scope other
than `codec(kind).encode(entityId).scope`, whatever the codec. A record built by
hand, or resolved with a codec map that differs from the store's, gets the
address its kind's codec says it should have.

It does not capture a resolver that throws: a caller handed a consumer-injected
resolver wraps the call in `captureResult`, as `ScoreUnionMergeStrategy` does.
