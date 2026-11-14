[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryObservationPhase

# Type Alias: MemoryObservationPhase

> **MemoryObservationPhase** = `"read"` \| `"write"` \| `"delete"` \| `"retrieve"`

The store/retriever operation an observation record describes.

## Remarks

`'read'` / `'write'` / `'delete'` are fired post-op by
[FileTreeMemoryStore](../classes/FileTreeMemoryStore.md) (on `get` / `put` / `delete` respectively) when
observers are wired. `'retrieve'` is reserved for retriever-fired
observations; no B2 retriever fires one (a single seq authority per
observation store is the supported topology), so it never appears in B2 but
is part of the vocabulary so a future retriever-firing hook is additive.
