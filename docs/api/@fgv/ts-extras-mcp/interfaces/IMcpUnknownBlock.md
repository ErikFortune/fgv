[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpUnknownBlock

# Interface: IMcpUnknownBlock

A content block this package does not carry: a block type it does not know, or a known type
whose required fields are missing or malformed. It never fails the call.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-blocktype"></a> `blockType?` | `readonly` | `string` | The block's `type` as the server sent it, when that is one printable line of at most 64 characters. A known type here (`'image'`, say) means the block was malformed. |
| <a id="property-type"></a> `type` | `readonly` | `"unknown"` | - |
