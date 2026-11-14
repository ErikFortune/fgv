[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / DEFAULT\_SIMILARITY\_THRESHOLD

# Variable: DEFAULT\_SIMILARITY\_THRESHOLD

> `const` **DEFAULT\_SIMILARITY\_THRESHOLD**: `number` = `0.85`

The default stage-4 layer-2 cosine similarity threshold (design note §2). A
near-duplicate candidate is surfaced to the [IEntityResolver](../interfaces/IEntityResolver.md) only when
its nearest neighbor scores `>= 0.85`.
