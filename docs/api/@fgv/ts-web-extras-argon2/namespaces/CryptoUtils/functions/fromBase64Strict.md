[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / fromBase64Strict

# Function: fromBase64Strict()

> **fromBase64Strict**(`base64`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes a base64 string to a `Uint8Array`, **rejecting input that is not
well-formed base64** instead of silently salvaging what it can.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base64` | `string` | Base64 string to decode. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the decoded bytes, or `Failure` if `base64` is not
well-formed.

## Remarks

The difference from [fromBase64](fromBase64.md) is the failure
mode, and it is the whole reason this exists. `fromBase64` is `Buffer`-first
where a `Buffer` exists, and `Buffer.from(s, 'base64')` **discards** characters
outside the base64 alphabet rather than complaining — so a corrupted or
truncated payload decodes to plausible-looking garbage and the corruption is
discovered, if ever, much further downstream. Use this variant whenever the
base64 arrived from somewhere you do not control (a wire response, a file, user
input) and a malformed value means "something is wrong", not "do your best".

Implemented over `atob`, which rejects out-of-alphabet characters and bad
lengths. Note it inherits `atob`'s one leniency: per the WHATWG forgiving-base64
algorithm, ASCII whitespace inside the input is stripped rather than rejected.
That is deliberate — line-wrapped base64 is common and benign — and it does not
weaken the guarantee that matters here, which is that corrupt bytes fail loudly.
