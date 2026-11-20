[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIngestedRecordResult

# Interface: IIngestedRecordResult

Per-candidate outcome of an ingest run.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidate"></a> `candidate` | `readonly` | [`ICandidateRecord`](ICandidateRecord.md) | The candidate the outcome is for. |
| <a id="property-conflict"></a> `conflict?` | `readonly` | [`IMemoryWriteConflict`](IMemoryWriteConflict.md) | Set exactly when `disposition` is `conflict`: the `seq` the merge expected at its target and the `seq` the store found there (`'absent'` when the target had gone). |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`IngestDisposition`](../type-aliases/IngestDisposition.md) | What the write ultimately did. |
| <a id="property-edges"></a> `edges` | `readonly` | readonly [`ICandidateEdge`](ICandidateEdge.md)[] | The stage-5 edges attached to this candidate before the write. |
| <a id="property-id"></a> `id` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The stored record's id: the newly-written id (`written` / `merged`), or the existing target's id (`deduped`, and the merge target's for `conflict`). |
| <a id="property-interlock"></a> `interlock?` | `readonly` | `"temporal-versioned"` | Informational diagnostic, set to `'temporal-versioned'` when the contradicts→temporal interlock is recognized: a `contradicts` edge was attached to a candidate of a temporal kind. **Remarks** A temporal kind ALWAYS writes through the store's versioned put path (that is the codec's `isVersioned` behavior — the prior version is invalidated and a new version written on every write, contradicts edge or not). This flag does NOT cause that routing; it is a diagnostic marker that the contradicts-driven scenario occurred, so callers can distinguish a contradiction-superseding version from an ordinary revision. |
| <a id="property-record"></a> `record?` | `readonly` | [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> | The persisted record, when a write happened (`written` / `merged`). |
| <a id="property-resolution"></a> `resolution` | `readonly` | [`ResolutionVerdict`](../type-aliases/ResolutionVerdict.md) | The resolution verdict fgv reached (or the resolver returned). |
