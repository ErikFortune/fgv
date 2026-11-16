[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / connectMcpSession

# Function: connectMcpSession()

> **connectMcpSession**(`params`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMcpSession`](../interfaces/IMcpSession.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

Connects to an MCP server over the given transport and performs the initialize handshake.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IConnectMcpSessionParams`](../interfaces/IConnectMcpSessionParams.md) | Transport plus optional client identity, logger and close observer. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMcpSession`](../interfaces/IMcpSession.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

`Success` with an opaque [IMcpSession](../interfaces/IMcpSession.md), or `Failure` if the transport handle is
foreign or the connection/handshake fails. The failure's detail is a [McpFailureReason](../type-aliases/McpFailureReason.md).
