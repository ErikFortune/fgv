[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpStdioTransportParams

# Interface: IMcpStdioTransportParams

Parameters for [createStdioTransport](../functions/createStdioTransport.md). The transport spawns `command` as a
subprocess and speaks MCP over its stdin/stdout.

## Remarks

**Security:** stdio transport executes a consumer-supplied command. Treat `command`/`args`
as a trust boundary — never source them from untrusted input. See the package README.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | readonly `string`[] | Arguments passed to the command. |
| <a id="property-command"></a> `command` | `readonly` | `string` | Executable to spawn (e.g. `'npx'`, `'node'`, an absolute path). |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | Working directory for the spawned process. |
| <a id="property-env"></a> `env?` | `readonly` | `Record`\<`string`, `string`\> | Environment variables for the spawned process. When omitted, the SDK's safe default set is used. |
