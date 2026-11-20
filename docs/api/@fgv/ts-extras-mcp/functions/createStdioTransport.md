[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / createStdioTransport

# Function: createStdioTransport()

> **createStdioTransport**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

Creates a stdio MCP transport that speaks MCP over the stdin/stdout of a spawned subprocess.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IMcpStdioTransportParams`](../interfaces/IMcpStdioTransportParams.md) | The command, arguments, environment, and working directory. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

`Success` with an opaque transport handle, or `Failure` if the SDK constructor throws
(e.g. an empty command).

## Remarks

**Security — trust boundary.** The transport spawns `params.command` (with `params.args`) as a
child process. Never source the command or arguments from untrusted input; treat them with the
same care as any shell-out. See the package README's security note.
