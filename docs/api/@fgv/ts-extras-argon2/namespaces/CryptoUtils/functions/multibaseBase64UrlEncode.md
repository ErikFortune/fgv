[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / multibaseBase64UrlEncode

# Function: multibaseBase64UrlEncode()

> **multibaseBase64UrlEncode**(`data`): `string`

Encodes a `Uint8Array` as a multibase base64url (no-padding) string.

The multibase prefix `'m'` identifies the encoding as RFC 4648 base64url
without padding. The body uses base64url alphabet: `+` → `-`, `/` → `_`,
and trailing `=` padding is stripped.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Uint8Array` | The binary data to encode. |

## Returns

`string`

A multibase-prefixed base64url string (`'m' + base64url-no-pad`).
