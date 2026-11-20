[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpToolExecution

# Interface: IMcpToolExecution

Normalized MCP `Tool.execution` — the tool's execution metadata.

## Remarks

Validated like [IMcpToolAnnotations](IMcpToolAnnotations.md): each known field is converted on its own, and an
unknown or malformed value that reaches this package is dropped (and logged at `info`), never
failing discovery and never propagated raw. **Through the SDK, though, an unknown or malformed
value fails the whole `tools/list` page as `'protocol'`** before it reaches this package: the SDK
parses each page against its own schema, whose `execution` is closed. Only a value that gets past
that parse is dropped and logged.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-tasksupport"></a> `taskSupport?` | `readonly` | [`McpTaskSupport`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | The tool's task support, when it declared a known value. Absent means `'forbidden'`. |
