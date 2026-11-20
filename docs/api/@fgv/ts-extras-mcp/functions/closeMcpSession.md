[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / closeMcpSession

# Function: closeMcpSession()

> **closeMcpSession**(`session`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>

Closes an MCP session, tearing down the transport (and any spawned subprocess).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`IMcpSession`](../interfaces/IMcpSession.md) | A session from [connectMcpSession](connectMcpSession.md). |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>

`Success(true)`, or `Failure` if the handle is foreign or the close call throws.

## Remarks

The session's `onClose` callback, when one was supplied, fires as part of this close.

**Streamable HTTP.** Before closing the transport, the close ends the session on the server by
sending the Streamable-HTTP `DELETE` (the SDK's `terminateSession()`), so the server can free it
rather than wait for its own idle timeout. This is best-effort and bounded: a server that answers
405 (it does not support termination), fails, drops the connection or never answers does not
fail the close, and delays it by at most two seconds. A termination failure is logged at `detail`
to the session's `logger`. Only the first close of a session sends the `DELETE`. Stdio and custom
transports are closed exactly as before.

A call still in flight when the `DELETE` lands may be failed by the server before the transport
closes, so it can report the server's answer (`'protocol'`, `'session-expired'`) rather than
`'not-connected'`.
