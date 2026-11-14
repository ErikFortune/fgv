[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [SaferFetch](../README.md) / browserSaferFetchJson

# Function: browserSaferFetchJson()

## Call Signature

> **browserSaferFetchJson**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

Fetches a URL in a browser and parses the response body as JSON, yielding the raw `JsonValue`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`ISaferFetchOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | Call options. `addressGuard` is required. |

### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

### Remarks

See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer.

## Call Signature

> **browserSaferFetchJson**\<`T`\>(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`T`\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

Fetches a URL in a browser, parses the response body as JSON, and runs it through the supplied
converter or validator so the caller reaches a validated `T` in one step.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`IBrowserSaferFetchJsonOptions`](../interfaces/IBrowserSaferFetchJsonOptions.md)\<`T`\> | Call options plus the required `converter`. `addressGuard` is required. |

### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\<`T`\>, [`FetchFailureReason`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

### Remarks

`T` is inferred from `converter` and is never caller-asserted, so the returned type is
evidenced at runtime rather than claimed.

See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer.
