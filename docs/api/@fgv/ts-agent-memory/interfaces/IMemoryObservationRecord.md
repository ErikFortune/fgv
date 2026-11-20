[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryObservationRecord

# Interface: IMemoryObservationRecord

A single audit record produced by an observed store (or retriever) operation.

## Remarks

`seq` and `timestamp` are assigned by the firing authority (the store) before
fan-out, so the same record carries the same `seq` across every observer it
lands in. `seq` is strictly increasing per authority, satisfying the
`RetainingRingBuffer` cursor contract that [MemoryObservationStore](../classes/MemoryObservationStore.md)
relies on.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-embed"></a> `embed?` | `readonly` | [`MemoryEmbedOutcome`](../type-aliases/MemoryEmbedOutcome.md) | For `'write'` observations: what the record-granular vector index did about this record. Absent when the question does not apply — see [MemoryEmbedOutcome](../type-aliases/MemoryEmbedOutcome.md). |
| <a id="property-error"></a> `error?` | `readonly` | `string` | Present on failure: the failure `Result`'s message. |
| <a id="property-id"></a> `id?` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The record id the operation touched, when resolvable. |
| <a id="property-kind"></a> `kind?` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The kind the operation targeted, when known. |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`MemoryObservationOutcome`](../type-aliases/MemoryObservationOutcome.md) | Whether the operation succeeded. |
| <a id="property-phase"></a> `phase` | `readonly` | [`MemoryObservationPhase`](../type-aliases/MemoryObservationPhase.md) | Which operation this record describes. |
| <a id="property-provenance"></a> `provenance?` | `readonly` | [`IProvenance`](IProvenance.md) | Structured provenance of the write, when the operation carried one. |
| <a id="property-querysnapshot"></a> `querySnapshot?` | `readonly` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | For `'retrieve'` observations: an opaque snapshot of the query that drove the retrieval. Carried verbatim; never interpreted by the store. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the operation touched, when resolvable. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number assigned by the firing authority, stable across a store's ring eviction. The ordering / paging key. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when the firing authority produced the record. |
