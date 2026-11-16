[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentQueryOptions

# Interface: IFragmentQueryOptions

Selection-time narrowing for [IFragmentVectorIndex.query](IFragmentVectorIndex.md#query). Every member is
applied **before** the `topK` cut.

## Remarks

`scope` (optionally with `id`) is the record narrowing. It is expressed as a
storage address rather than as a consumer-facing `(kind, entityId)` because that
is what the index is keyed by; resolving one to the other is
`IIdentityResolver.resolveIdentity`'s job, and doing it above the index keeps the
index dealing only in the keys it actually holds.

**`scope` alone is not a coarser accident — it is what a versioned kind needs.**
`TemporalIdentityCodec` files every version of an entity in its own per-entity
subtree, so for a versioned kind the entity's subtree *is* the narrowing and
`{ scope }` means "every version of this entity". A non-versioned kind resolves to
a single record and supplies `{ scope, id }`.

**"Every version" is literal, and includes superseded ones.** Invalidation stamps
`invalid_at` on an envelope; it does not prune that version's fragments from the
index. So a scope-narrowed query returns current and historical fragments alike,
and a hit carries nothing that distinguishes them — `IVectorQueryHit` has no
temporal fields. This is the record-granular vector lane's existing behaviour
rather than something this narrowing introduces, but do not read the subtree
narrowing as currency filtering: it is not, and there is no `asOf` axis here to
make it so.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | With [IFragmentQueryOptions.scope](#property-scope), restrict further to the single record at `(scope, id)`. Ignored — and meaningless — without `scope`, since a bare `id` does not address a record. |
| <a id="property-maxperrecord"></a> `maxPerRecord?` | `readonly` | `number` | Maximum number of fragments any single record may contribute. Omit for uncapped. With a single-record narrowing (`scope` + `id`) this caps the one record's contribution, which is a second cap on the same axis rather than a cross-record fairness knob — usually you want one or the other, not both. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | Restrict the search to fragments of records in this scope. Omit to search every record. |
