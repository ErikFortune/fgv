[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / memoryDurabilityRequirements

# Variable: memoryDurabilityRequirements

> `const` **memoryDurabilityRequirements**: readonly \[`"session"`, `"process-crash"`\]

The atomic-write guarantees a host can require of a [FileTreeMemoryStore](../classes/FileTreeMemoryStore.md)'s root,
weakest to strongest. These are the guarantees `@fgv/ts-json-base` can qualify a root for.
