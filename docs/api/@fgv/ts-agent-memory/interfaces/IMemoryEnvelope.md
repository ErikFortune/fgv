[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryEnvelope

# Interface: IMemoryEnvelope

The invariant identity + transaction-time envelope carried by every memory
record, independent of the per-kind body.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contenthash"></a> `contentHash` | `readonly` | `string` | Content hash over the canonical `{ kind, body, links }`. The dedup key: an exact match is a no-op upsert that returns the existing record. |
| <a id="property-created"></a> `created` | `readonly` | `number` | Epoch ms of the first write. Immutable after creation. |
| <a id="property-embeddingref"></a> `embeddingRef?` | `readonly` | `string` \| `null` | Vector-index entry reference, set by the vector index on write. `null` = not embedded; absent = same as `null` (backwards-compat seam). |
| <a id="property-entityid"></a> `entityId` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | Consumer-supplied domain key. Equals [id](#property-id) for non-temporal kinds. |
| <a id="property-id"></a> `id` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | Stable file-stem identifier. MUST equal the on-disk filename stem. |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | Consumer-registered kind; dispatches the body Converter. |
| <a id="property-links"></a> `links` | `readonly` | readonly [`IEdge`](IEdge.md)[] | Attributed outbound edges. |
| <a id="property-provenance"></a> `provenance` | `readonly` | [`IProvenance`](IProvenance.md) | Structured provenance (never a flat enum). |
| <a id="property-rank"></a> `rank?` | `readonly` | `number` | Store-computed host-defined ordering value, produced by the kind's [RankProjector](../type-aliases/RankProjector.md) on every put/update and stamped into the envelope in the same pass that recomputes [contentHash](#property-contenthash). Absent when the kind has no registered projector (or the projector threw on this record). Ordered retrieval (`orderBy: 'rank'`) and the index's rank view sort by this value descending, placing records with an absent `rank` last. **The projector runs on the write path only — registering one does not rank records already in the store.** Because absent sorts last, those records land below every subsequently-written one regardless of what the projector would have scored them, so the result is not a partial ordering but one inverted with respect to the projector's intent, with nothing failing to say so. Call `IMemoryStore.reconcile(kind, 'rank')` after registering a projector against a populated store. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic write counter within the store instance, assigned by the store on every successful put. Enables stable cursor paging over observation records without a full walk. |
| <a id="property-tags"></a> `tags` | `readonly` | readonly [`Tag`](../type-aliases/Tag.md)[] | Open-vocabulary tags. |
| <a id="property-temporal"></a> `temporal?` | `readonly` | [`ITemporalBlock`](ITemporalBlock.md) | Bi-temporal validity. Present only on temporal kinds. |
| <a id="property-updated"></a> `updated` | `readonly` | `number` | Epoch ms of the most recent write. |
