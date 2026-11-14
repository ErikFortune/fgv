[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / hexEncode

# Function: hexEncode()

> **hexEncode**(`data`): `string`

Encodes a `Uint8Array` as a lowercase hexadecimal string with no `0x` prefix.

Each byte becomes exactly two lowercase hex characters (zero-padded), so an
`n`-byte input yields a `2n`-character string. An empty input yields the empty
string. This is the inverse of [CryptoUtils.hexDecode](hexDecode.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Uint8Array` | The binary data to encode. |

## Returns

`string`

The lowercase, unprefixed hex string.
