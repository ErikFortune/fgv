[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryId

# Type Alias: MemoryId

> **MemoryId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"MemoryId"`\>

Stable file-stem identifier for a memory record. Equals the codec-produced
`idStem` and the on-disk filename stem (the store's load-time identity check enforces the
round-trip).
