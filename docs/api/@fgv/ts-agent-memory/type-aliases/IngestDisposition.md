[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IngestDisposition

# Type Alias: IngestDisposition

> **IngestDisposition** = `"written"` \| `"deduped"` \| `"merged"` \| `"conflict"`

How a candidate was ultimately written (or not) after resolution.

- `written` — persisted as a fresh record (verdict `new`), or as a superseding
  record (verdict `supersede`).
- `deduped` — not written; an existing record satisfied it (verdict
  `duplicate-of`, incl. every layer-1 exact `{ kind, body }` match; or a `merge-into` whose
  merged content the store found already stored under another id — its `id` is that record's).
- `merged` — merged into an existing target entity (verdict `merge-into`).
- `conflict` — not written: a `merge-into` whose target changed after the pre-ingest snapshot
  the merge was planned from. The store refused the write; nothing is retried. See
  [IIngestedRecordResult.conflict](../interfaces/IIngestedRecordResult.md#property-conflict).
