[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / ISaferFetchResponseHead

# Interface: ISaferFetchResponseHead

Response status and headers, available before any body bytes are read.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contentlength"></a> `contentLength?` | `readonly` | `number` | Parsed `content-length`, present only when the header was sent and is a valid count. |
| <a id="property-contenttype"></a> `contentType?` | `readonly` | `string` | Raw `content-type` header value, including any parameters. |
| <a id="property-headers"></a> `headers` | `readonly` | `Readonly`\<`Record`\<`string`, `string`\>\> | Header names are lowercased. |
| <a id="property-status"></a> `status` | `readonly` | `number` | - |
| <a id="property-statustext"></a> `statusText` | `readonly` | `string` | - |
