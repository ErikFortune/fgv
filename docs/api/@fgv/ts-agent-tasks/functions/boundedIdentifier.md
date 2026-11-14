[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / boundedIdentifier

# Function: boundedIdentifier()

> **boundedIdentifier**(`maxLength`, `description`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Builds a converter for a bounded safe identifier.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `maxLength` | `number` | maximum length. The accepted syntax is ASCII-only, so this is equally a UTF-8 byte bound. |
| `description` | `string` | what the identifier names, for error messages. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>
