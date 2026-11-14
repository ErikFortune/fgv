[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / multibaseBase64UrlDecode

# Function: multibaseBase64UrlDecode()

> **multibaseBase64UrlDecode**(`encoded`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes a multibase base64url (no-padding) string back to a `Uint8Array`.

Validates that the first character is `'m'` (the multibase prefix for
RFC 4648 base64url without padding), then decodes the remaining body.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encoded` | `string` | A multibase-prefixed base64url string. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the decoded bytes, or `Failure` with error context.
