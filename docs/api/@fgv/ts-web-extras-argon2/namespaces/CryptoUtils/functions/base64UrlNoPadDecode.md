[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / base64UrlNoPadDecode

# Function: base64UrlNoPadDecode()

> **base64UrlNoPadDecode**(`encoded`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes a base64url (no-padding) string (RFC 4648 §5) back to a `Uint8Array`.

This is the bare primitive with no multibase prefix; use
[CryptoUtils.multibaseBase64UrlDecode](multibaseBase64UrlDecode.md) to decode a multibase-`'m'`-prefixed value.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encoded` | `string` | The base64url-no-pad body to decode. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the decoded bytes, or `Failure` with error context.
