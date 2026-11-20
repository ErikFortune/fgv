[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ResolutionVerdict

# Type Alias: ResolutionVerdict

> **ResolutionVerdict** = \{ `verdict`: `"new"`; \} \| \{ `target`: [`IEdgeTarget`](../interfaces/IEdgeTarget.md); `verdict`: `"duplicate-of"`; \} \| \{ `target`: [`IEdgeTarget`](../interfaces/IEdgeTarget.md); `verdict`: `"supersede"`; \} \| \{ `target`: [`IEdgeTarget`](../interfaces/IEdgeTarget.md); `verdict`: `"merge-into"`; \}

The four dedup verdicts a [IEntityResolver](../interfaces/IEntityResolver.md) (or fgv's exact-match layer)
returns for a candidate. See the design note §3 for the verdict → write
disposition mapping. Each target-bearing arm carries a scope-qualified
[IEdgeTarget](../interfaces/IEdgeTarget.md) (not a bare [MemoryId](MemoryId.md)) so the verdict resolves to a
single record even when a filename stem is reused across scopes.
