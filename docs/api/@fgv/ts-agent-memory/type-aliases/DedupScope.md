[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / DedupScope

# Type Alias: DedupScope

> **DedupScope** = `"content"` \| `"entity"`

The granularity at which the store deduplicates an incoming write against the
existing vault, declared per kind via [IWritePolicy.dedupScope](../interfaces/IWritePolicy.md#property-dedupscope).

- `'content'`: scope-wide cross-id content dedup. An identical
  `{ kind, body, links }` triple ANYWHERE in the scope — even under a
  different id — is a no-op that returns the existing record. The knowledge
  kind family uses this.
- `'entity'`: same-id content dedup only. An identical re-put of the SAME
  entity is a no-op, but two DISTINCT entities with identical content never
  collapse. The experience (memory) kind families use this so that, e.g.,
  two turns whose summaries happen to be byte-identical both persist.
