[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / DEFAULT\_MEMORY\_TOOLS

# Variable: DEFAULT\_MEMORY\_TOOLS

> `const` **DEFAULT\_MEMORY\_TOOLS**: `ReadonlyArray`\<[`MemoryToolName`](../type-aliases/MemoryToolName.md)\>

The default tool subset when [tools](../interfaces/ICreateMemoryToolsParams.md#property-tools) is
omitted: the read-only set. Mutating tools (`memory_write` / `memory_delete`)
are **off by default** and must be named explicitly — writes stay
curation-mediated unless the host opts in.
