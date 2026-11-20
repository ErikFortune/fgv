[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / hexDecode

# Function: hexDecode()

> **hexDecode**(`encoded`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes a hexadecimal string (no `0x` prefix) back to a `Uint8Array`.

Liberal in what it accepts: both lowercase and uppercase hex digits are
allowed (whereas [CryptoUtils.hexEncode](hexEncode.md) always emits lowercase). The
input must have even length and contain only hex digits (`0-9`, `a-f`, `A-F`);
an empty string decodes to an empty `Uint8Array`. Odd length or any non-hex
character fails with error context.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encoded` | `string` | The hex string to decode. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the decoded bytes, or `Failure` with error context.
