[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpSession

# Interface: IMcpSession

Opaque handle to a connected MCP session. Pass it to [listMcpTools](../functions/listMcpTools.md),
[callMcpTool](../functions/callMcpTool.md), [adaptMcpTools](../functions/adaptMcpTools.md), and [closeMcpSession](../functions/closeMcpSession.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-clientname"></a> `clientName` | `readonly` | `string` | Client name advertised during the handshake. |
| <a id="property-clientversion"></a> `clientVersion` | `readonly` | `string` | Client version advertised during the handshake. |
| <a id="property-serverinfo"></a> `serverInfo` | `readonly` | [`IMcpServerInfo`](IMcpServerInfo.md) \| `undefined` | Server identity reported by the handshake, when the server provided one. |
