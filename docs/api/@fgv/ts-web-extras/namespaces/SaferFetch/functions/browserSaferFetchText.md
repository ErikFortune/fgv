[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [SaferFetch](../README.md) / browserSaferFetchText

# Function: browserSaferFetchText()

> **browserSaferFetchText**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`string`\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

Fetches a URL in a browser and decodes the response body as text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`ISaferFetchOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | Call options. `addressGuard` is required. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`string`\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

## Remarks

See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer and for
the warning about echoing failure detail to untrusted callers.
