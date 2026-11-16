[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpTransport

# Interface: IMcpTransport

Opaque handle to an MCP transport produced by [createStdioTransport](../functions/createStdioTransport.md),
[createHttpTransport](../functions/createHttpTransport.md) or [createCustomTransport](../functions/createCustomTransport.md). Hand it to
[connectMcpSession](../functions/connectMcpSession.md); do not construct directly.

## Remarks

A handle is single-use: the session that connects over it owns the underlying transport, and
closing that session closes the transport.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-transportkind"></a> `transportKind` | `readonly` | [`McpTransportKind`](../type-aliases/McpTransportKind.md) | Which transport kind this handle wraps. |
