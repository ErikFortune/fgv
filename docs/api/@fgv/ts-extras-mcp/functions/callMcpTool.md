[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / callMcpTool

# Function: callMcpTool()

> **callMcpTool**(`session`, `name`, `args`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMcpToolCallResult`](../interfaces/IMcpToolCallResult.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

Calls a named tool on a connected MCP server.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`IMcpSession`](../interfaces/IMcpSession.md) | A session from `connectMcpSession`. |
| `name` | `string` | The tool name to invoke. |
| `args` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The tool arguments (a JSON object). |
| `options?` | [`IMcpCallToolOptions`](../interfaces/IMcpCallToolOptions.md) | Optional timeout, abort signal, progress callback and media opt-in for this call. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMcpToolCallResult`](../interfaces/IMcpToolCallResult.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

`Success` with the projected result, or `Failure` on tool error / transport error /
foreign handle. The failure's detail is a [McpFailureReason](../type-aliases/McpFailureReason.md).

## Remarks

The SDK `CallToolResult` is projected to [IMcpToolCallResult](../interfaces/IMcpToolCallResult.md): every content block,
converter-validated, as `blocks`; their text projection as `content`; and `structuredContent`
when it is JSON. An unknown or malformed block becomes an `unknown` block and never fails the
call. Media data (image, audio, blob) is carried only when `options.includeMediaData` is `true`.
A `resource_link` is reported, never followed.

The result is read with the SDK's generic result schema rather than its `CallToolResult` schema,
which rejects the whole response over one block of a type it does not know; this package
validates the result itself. The SDK still checks `structuredContent` against the tool's
`outputSchema` when an earlier `listMcpTools` gave it one.

A result flagged `isError: true` is mapped to a failure whose message is the text projection
**verbatim** and whose detail is `'tool-error'` — it is never swallowed, so
`executeClientToolTurn` routes the server's own words back to the model as a provider-native
error tool-result. Every other failure is prefixed `callMcpTool '<name>':` and classified per
[McpFailureReason](../type-aliases/McpFailureReason.md).
