[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / materializeEntries

# Function: materializeEntries()

> **materializeEntries**(`entries`, `resolver`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

Materialize entries through the resolver, dropping any that have vanished
since selection — a concurrent delete between selecting an envelope and
reading its body is a legitimate race and yields a shorter list, not an error.
A read that FAILS is a real fault and propagates.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[] |
| `resolver` | [`IMemoryRecordResolver`](../interfaces/IMemoryRecordResolver.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>
