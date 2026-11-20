[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / saferFetchText

# Function: saferFetchText()

> **saferFetchText**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`string`\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

Fetches a URL and decodes the response body as text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`ISaferFetchOptions`](../interfaces/ISaferFetchOptions.md) | Call options. `addressGuard` is required. `maxResponseBytes` defaults to 5 MiB and is meant to be tuned per call. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`string`\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

## Remarks

The charset comes from the `Content-Type` parameter and defaults to UTF-8. Decoding is
strict: an unknown charset, or a byte sequence that is not valid in the declared one, fails
as `'decode'` rather than silently producing mojibake that some caller downstream treats as
data.

See [SaferFetch.saferFetchBytes](saferFetchBytes.md) for what this primitive does **not** protect against,
and for the warning about echoing failure detail to untrusted callers.
