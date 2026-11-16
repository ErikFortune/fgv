[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIngestItem

# Interface: IIngestItem

A single unit of raw source material handed to the ingest pipeline. The host
owns the shape of [content](#property-content) — fgv never interprets
it; it flows opaquely into the host's classifier and extractor (stages 2-3).

Single-item ingest is FIRST-CLASS: the orchestrator's primary entry point
takes one `IIngestItem` (per-turn streaming), and the batch entry point is a
convenience loop over it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `unknown` | The opaque source payload the host's classifier / extractor understand (e.g. a raw turn, a document, a tool-call transcript). Never interpreted by fgv. |
| <a id="property-id"></a> `id` | `readonly` | `string` | Host-owned identity for this source item. Opaque to fgv; used only in diagnostics and echoed back on the [IIngestItemResult](IIngestItemResult.md). |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Record`\<`string`, `unknown`\> | Optional opaque metadata carried alongside the item; never interpreted by fgv. |
| <a id="property-sourceid"></a> `sourceId?` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | Optional scope-qualified address of the memory record this item was derived from (e.g. the MTM turn an extracted fact came from). When present, fgv stamps it as [provenance.derivedFrom](IProvenance.md#property-derivedfrom) on every record ingested from this item (stage 6) — the cross-kind provenance spine. That is provenance, not a live reference: it keeps naming the source after the source is withdrawn or superseded. A scope-qualified [IEdgeTarget](IEdgeTarget.md) (not a bare [MemoryId](../type-aliases/MemoryId.md)) because per-scope codecs legally reuse a stem across scopes, so a bare id would be ambiguous. |
