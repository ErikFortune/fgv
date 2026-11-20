[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryRecordErrorMode

# Type Alias: MemoryRecordErrorMode

> **MemoryRecordErrorMode** = `"skip"` \| `"fail"`

Policy for how [FileTreeMemoryStore.create](../classes/FileTreeMemoryStore.md#create)'s initial vault walk reacts
to a record that fails to parse or validate.

- `'fail'` (the default) — one unreadable record fails the whole open. The
  walk collapses per-record results with `mapResults`, so any single failure
  aborts `create()`. This is the historical behavior, preserved byte-for-byte.
- `'skip'` — an unreadable record is quarantined (not indexed) rather than
  failing the open. Every record that DOES parse loads normally; each skip is
  logged at `warn` and surfaced structurally on
  [FileTreeMemoryStore.skippedRecords](../classes/FileTreeMemoryStore.md#skippedrecords). The offending file is never
  deleted or mutated, so a later open (after the body converter is fixed)
  re-indexes it. A vault holds every kind in one store, so a required-field
  migration on one kind must not make every other record unreadable.
