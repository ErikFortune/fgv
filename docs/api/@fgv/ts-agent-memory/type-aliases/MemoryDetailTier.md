[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryDetailTier

# Type Alias: MemoryDetailTier

> **MemoryDetailTier** = `"gist"` \| `"full"`

The detail tier a `memory_search` / `memory_context` result is projected at.
`'gist'` is the default (bounded) path; `'full'` is opt-in. Only meaningful
when a host [projectItem](../interfaces/ICreateMemoryToolsParams.md#property-projectitem) is
supplied — the built-in default projection returns the full body regardless.
