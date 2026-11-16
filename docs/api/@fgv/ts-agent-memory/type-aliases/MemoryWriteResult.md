[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryWriteResult

# Type Alias: MemoryWriteResult\<T\>

> **MemoryWriteResult**\<`T`\> = [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IMemoryWriteFailure`](IMemoryWriteFailure.md)\>

What [IMemoryStore.put](../interfaces/IMemoryStore.md#put) and [IMemoryStore.delete](../interfaces/IMemoryStore.md#delete) return. A failure always carries
an [IMemoryWriteFailure](IMemoryWriteFailure.md); use `.asResult` to chain into plain `Result` code.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |
