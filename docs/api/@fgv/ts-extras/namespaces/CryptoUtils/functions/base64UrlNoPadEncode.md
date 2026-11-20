[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / base64UrlNoPadEncode

# Function: base64UrlNoPadEncode()

> **base64UrlNoPadEncode**(`data`): `string`

Encodes a `Uint8Array` as a base64url (no-padding) string (RFC 4648 §5).

The body uses the base64url alphabet (`+` → `-`, `/` → `_`) and trailing `=`
padding is stripped. This is the bare primitive with no multibase prefix; use
[CryptoUtils.multibaseBase64UrlEncode](multibaseBase64UrlEncode.md) when a multibase-`'m'`-prefixed value is required.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Uint8Array` | The binary data to encode. |

## Returns

`string`

The base64url-no-pad string.
