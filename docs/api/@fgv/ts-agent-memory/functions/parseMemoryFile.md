[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / parseMemoryFile

# Function: parseMemoryFile()

> **parseMemoryFile**(`raw`, `registry`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>\>

Parse a complete memory file into a typed [IMemoryRecord](../interfaces/IMemoryRecord.md). Splits the
frontmatter, validates the envelope, and dispatches the body through the
registered Converter for the envelope's kind.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |
| `registry` | [`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>\>
