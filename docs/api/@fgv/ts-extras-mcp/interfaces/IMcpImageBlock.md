[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpImageBlock

# Interface: IMcpImageBlock

An `image` content block.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bytelength"></a> `byteLength` | `readonly` | `number` | The decoded size of the image, in bytes. |
| <a id="property-data"></a> `data?` | `readonly` | `string` | The base64 data as sent, only when [IMcpCallToolOptions.includeMediaData](IMcpCallToolOptions.md#property-includemediadata) is `true`. |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | The image's MIME type; absent when the server's was missing or not one printable line. The block keeps its size and data either way. |
| <a id="property-type"></a> `type` | `readonly` | `"image"` | - |
