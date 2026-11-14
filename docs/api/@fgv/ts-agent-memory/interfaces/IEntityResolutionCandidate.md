[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEntityResolutionCandidate

# Interface: IEntityResolutionCandidate

A near-duplicate candidate surfaced to the [IEntityResolver](IEntityResolver.md) by stage-4
layer-2 similarity search: an existing record whose embedding is within the
similarity threshold of the incoming candidate.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-record"></a> `record` | `readonly` | [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> | The existing record. |
| <a id="property-score"></a> `score` | `readonly` | `number` | The backend similarity score (higher = more similar). |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The existing record's scope-qualified `(scope, id)` address. Scope-qualified (not a bare [MemoryId](../type-aliases/MemoryId.md)) because per-scope codecs legally mint the same stem under different scopes — the [ResolutionVerdict](../type-aliases/ResolutionVerdict.md) target the resolver returns must round-trip this exact address so the write binds the intended record. |
