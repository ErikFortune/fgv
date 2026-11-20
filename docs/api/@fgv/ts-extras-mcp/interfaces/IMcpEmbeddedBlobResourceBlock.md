[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpEmbeddedBlobResourceBlock

# Interface: IMcpEmbeddedBlobResourceBlock

A `resource` content block embedding a binary resource.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bytelength"></a> `byteLength` | `readonly` | `number` | The decoded size of the resource, in bytes. |
| <a id="property-data"></a> `data?` | `readonly` | `string` | The base64 data as sent, only when [IMcpCallToolOptions.includeMediaData](IMcpCallToolOptions.md#property-includemediadata) is `true`. |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | Its MIME type, when the server gave one. |
| <a id="property-type"></a> `type` | `readonly` | `"resource"` | - |
| <a id="property-uri"></a> `uri?` | `readonly` | `string` | The embedded resource's URI; absent when the server's was missing or not one printable line. |
