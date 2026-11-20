[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryObservationQuery

# Interface: IMemoryObservationQuery

Query criteria for [MemoryObservationStore.query](../classes/MemoryObservationStore.md#query). All supplied criteria
are AND-combined.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-embed"></a> `embed?` | `readonly` | [`MemoryEmbedOutcome`](../type-aliases/MemoryEmbedOutcome.md) | Only `'write'` records with this embed outcome. Records carrying no embed outcome never match, so `embed: 'failed'` answers "which writes left the index short?" without a full scan of every record's `embeddingRef`. |
| <a id="property-kind"></a> `kind?` | `readonly` | [`Kind`](../type-aliases/Kind.md) | Only records that targeted this kind. |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | Return at most this many records — the most-recent N, still oldest-first. |
| <a id="property-outcome"></a> `outcome?` | `readonly` | [`MemoryObservationOutcome`](../type-aliases/MemoryObservationOutcome.md) | Only records with this outcome. |
| <a id="property-phase"></a> `phase?` | `readonly` | [`MemoryObservationPhase`](../type-aliases/MemoryObservationPhase.md) | Only records of this phase. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | Only records that touched this scope. |
| <a id="property-since"></a> `since?` | `readonly` | `number` | Only records with `timestamp >= since`. |
| <a id="property-sinceseq"></a> `sinceSeq?` | `readonly` | `number` | Only records with `seq > sinceSeq` (incremental paging cursor). |
| <a id="property-until"></a> `until?` | `readonly` | `number` | Only records with `timestamp <= until`. |
