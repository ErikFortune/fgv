[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IProvenance

# Interface: IProvenance

Structured provenance for a record or an edge. Never a flat enum — the
`[key: string]: unknown` index signature lets a consumer attach an opaque
domain payload (e.g. PersonAIlity's sentiment / epistemic blocks) without
changing this interface, while still satisfying the no-`any` rule.

## Indexable

> \[`key`: `string`\]: `unknown`

Opaque extension payload — consumer-owned, never interpreted by the store.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-by"></a> `by?` | `readonly` | `string` | Optional human or agent identifier responsible for the write. |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | Optional confidence in `[0, 1]`. |
| <a id="property-derivedfrom"></a> `derivedFrom?` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | Provenance, not a live reference: names the source record an ingest write derived this record from. The ingest orchestrator stamps it from `IIngestItem.sourceId`. A merge-into that supplies no `sourceId` keeps the target's earlier value, and one that does replaces it, so a merged record names its most recent ingest source rather than every source. On a direct put it is whatever the caller supplied. It deliberately keeps naming its source after that source is withdrawn — clearing it would erase a true fact, and repointing it would assert a write that never happened. It is the cross-kind provenance spine. A reader that resolves it must therefore handle a source that no longer exists, and, for a versioned kind, an address that names a version a later write has since superseded. No retrieval axis indexes this field; selecting records by it takes an `IMemoryQuery.filter` predicate over whole records. A scope-qualified [IEdgeTarget](IEdgeTarget.md) (not a bare [MemoryId](../type-aliases/MemoryId.md)) because per-scope codecs (e.g. the MTM codec's `turn-<n>` stems) legally reuse a stem across scopes, so a bare id would be ambiguous — the same reason [IEdge.target](IEdge.md#property-target) is scope-qualified. |
| <a id="property-model"></a> `model?` | `readonly` | `string` | Optional model identifier, when a model produced the content. |
| <a id="property-source"></a> `source` | `readonly` | [`ProvenanceSource`](../type-aliases/ProvenanceSource.md) | Where the attribution came from. |
