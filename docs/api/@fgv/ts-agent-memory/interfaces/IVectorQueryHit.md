[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IVectorQueryHit

# Interface: IVectorQueryHit

A single hit returned by [IVectorIndex.query](IVectorIndex.md#query) (or
[IFragmentVectorIndex.query](IFragmentVectorIndex.md#query)): the matched record's scope-qualified
[address](IEdgeTarget.md) and the backend's similarity score (higher = more
similar; the exact scale is backend-defined). Hits are returned in descending
score order.

## Remarks

The address is a `(scope, id)` pair, NOT a bare [MemoryId](../type-aliases/MemoryId.md) — per-scope
codecs (e.g. the medium-term codec's `turn-<n>` stems) legally mint the same
stem under different scopes, so a bare id could not disambiguate two records
that share a stem. The caller re-resolves the hit against the record index by
the same scoped address.

**No single field discriminates a fragment hit from a record-granular hit.** A
record hit carries neither `locator` nor `fragmentId`; a fragment hit carries at
least one of the two, but not necessarily any particular one — a fragment with a
body span but no consumer-minted id, and a fragment with an id but no honest span,
are both legal. Testing one field for presence therefore cannot tell you which
kind of hit you hold.

That "at least one" requirement is enforced on the upsert side by
[embeddedFragmentConverter](../variables/embeddedFragmentConverter.md) — a different boundary from this type — and is
deliberately NOT offered here as a discriminator either. A caller keyed off it
would be coupled to an invariant this type does not own, and would fail silently
if the invariant were ever relaxed.

**The robust rule is that fragment-ness is determined by which index produced the
hit**: [IFragmentVectorIndex.query](IFragmentVectorIndex.md#query) returns fragment hits and
[IVectorIndex.query](IVectorIndex.md#query) returns record hits. The caller chose the index it
queried, so it already knows which kind it is holding.

Note in particular that an absent `locator` now carries **two** distinct meanings
— a record-granular hit, or a fragment with no honest body span (see
[IFragmentLocator](IFragmentLocator.md)) — which is precisely why presence-branching is unsafe.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fragmentid"></a> `fragmentId?` | `readonly` | `string` | The opaque identity the producing fragment was stored with, carried back verbatim. Absent on record-granular hits AND on fragment hits stored without one — see the remarks above; do not branch on its presence. |
| <a id="property-locator"></a> `locator?` | `readonly` | [`IFragmentLocator`](IFragmentLocator.md) | The advisory in-record span the matched fragment was derived from, when the producing fragment carried one. Absent on record-granular hits AND on fragment hits with no honest span — see the remarks above; do not branch on its presence. |
| <a id="property-score"></a> `score` | `readonly` | `number` | Backend similarity score; higher is more similar. |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The scope-qualified address of the matched record. |
