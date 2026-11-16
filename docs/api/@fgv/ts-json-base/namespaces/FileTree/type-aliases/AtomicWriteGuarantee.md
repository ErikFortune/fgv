[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / AtomicWriteGuarantee

# Type Alias: AtomicWriteGuarantee

> **AtomicWriteGuarantee** = *typeof* [`atomicWriteGuarantees`](../variables/atomicWriteGuarantees.md)\[`number`\]

Durability guarantee an atomic write claims to honor.

## Remarks

Ordered weakest to strongest. `'session'` means only that a reader never
observes a torn write while the writing process is alive — nothing survives
a crash. `'process-crash'` additionally survives abrupt termination of the
writing process while the OS/filesystem keeps running. `'os-crash'` and
`'power-loss'` are stronger claims that no accessor in this package makes
yet; they are reserved for a future qualified implementation and requesting
either today fails rather than silently downgrading.
