[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / DEFAULT\_DEDUP\_SCOPE

# Variable: DEFAULT\_DEDUP\_SCOPE

> `const` **DEFAULT\_DEDUP\_SCOPE**: [`DedupScope`](../type-aliases/DedupScope.md) = `'entity'`

The default [DedupScope](../type-aliases/DedupScope.md) applied when a policy does not declare one.
Entity-scoped dedup is the safe default — it never silently collapses two
distinct entities with coincidentally-identical content.
