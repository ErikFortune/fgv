[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / serializeMemoryFile

# Function: serializeMemoryFile()

> **serializeMemoryFile**(`envelope`, `body`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Serialize an envelope and its rendered body text into a memory file. The
envelope is emitted as YAML frontmatter; the body is written verbatim after
the closing delimiter.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`IMemoryEnvelope`](../interfaces/IMemoryEnvelope.md) |
| `body` | `string` |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
