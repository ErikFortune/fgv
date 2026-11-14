[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryWriteOutcome

# Type Alias: MemoryWriteOutcome

> **MemoryWriteOutcome** = `"written"` \| `"deduped"`

Discriminates the outcome of a [memory\_write](../functions/createMemoryTools.md) call so
the agent can reason about what its write actually did.

## Remarks

- `written` — a new record was persisted, or an existing entity was updated.
- `deduped` — the content already existed (content-hash dedup no-op); the
  store returned the existing record unchanged.

The store's public `put` return does not surface cap-cull evictions, so a
`culled` outcome is not distinguishable at this layer without an L1 change or
observer wiring (both out of scope for L2). The writer's own record is always
`written` even when the write triggers a cull of older siblings.
