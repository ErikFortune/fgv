[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / ISaferFetchRequest

# Interface: ISaferFetchRequest

The request a safer-fetch call is about to issue.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body?` | `readonly` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | - |
| <a id="property-headers"></a> `headers` | `readonly` | `Readonly`\<`Record`\<`string`, `string`\>\> | Header names are lowercased. |
| <a id="property-method"></a> `method` | `readonly` | `"POST"` \| `"GET"` \| `"HEAD"` \| `"PUT"` \| `"DELETE"` \| `"PATCH"` | - |
| <a id="property-url"></a> `url` | `readonly` | `URL` | - |
