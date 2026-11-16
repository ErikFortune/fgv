[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpEmbeddedTextResourceBlock

# Interface: IMcpEmbeddedTextResourceBlock

A `resource` content block embedding a text resource.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | Its MIME type, when the server gave one. |
| <a id="property-text"></a> `text` | `readonly` | `string` | Its text, as the server sent it. |
| <a id="property-type"></a> `type` | `readonly` | `"resource"` | - |
| <a id="property-uri"></a> `uri?` | `readonly` | `string` | The embedded resource's URI; absent when the server's was missing or not one printable line. |
