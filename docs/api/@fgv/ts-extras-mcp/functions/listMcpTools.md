[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / listMcpTools

# Function: listMcpTools()

> **listMcpTools**(`session`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IMcpToolDescriptor`](../interfaces/IMcpToolDescriptor.md)[], [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

Lists every tool a connected MCP server advertises, following the SDK's `nextCursor`
pagination until the full catalog is accumulated.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`IMcpSession`](../interfaces/IMcpSession.md) | A session from `connectMcpSession`. |
| `options?` | [`IListMcpToolsOptions`](../interfaces/IListMcpToolsOptions.md) | Optional per-page request options, and the listing's bounds. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IMcpToolDescriptor`](../interfaces/IMcpToolDescriptor.md)[], [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

`Success` with the full tool catalog, or `Failure` on a foreign handle, an invalid option,
an exceeded bound, or a transport/protocol error. The failure's detail is a [McpFailureReason](../type-aliases/McpFailureReason.md).

## Remarks

The request options (`timeoutMs`, `signal`, progress) apply to each page. Two optional bounds
apply to the whole listing, and neither has a default: `maxPages` stops a server that pages
without end, and `maxTotalMs` stops one that pages slowly. Exceeding either fails the listing with
the `'limit-exceeded'` [McpFailureReason](../type-aliases/McpFailureReason.md), naming the bound; the pages already read are
discarded, never returned as a truncated catalog.
