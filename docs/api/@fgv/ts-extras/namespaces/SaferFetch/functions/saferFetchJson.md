[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / saferFetchJson

# Function: saferFetchJson()

## Call Signature

> **saferFetchJson**(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

Fetches a URL and parses the response body as JSON, yielding the raw `JsonValue` for the
caller to validate.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`ISaferFetchOptions`](../interfaces/ISaferFetchOptions.md) | Call options. `addressGuard` is required. `maxResponseBytes` defaults to 5 MiB and is meant to be tuned per call. |

### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

### Remarks

**This does not gate on `Content-Type` by itself.** A server returning an HTML error page
with a `200` will be decoded and parsed, and fail as `'parse'` — twenty frames from where it
actually went wrong. Pass `responseHeadersGuard: allowContentTypes(['application/json'])`
to reject on the header instead: it costs a header comparison rather than a body transfer,
and the failure names the type. Content-type gating is a guard rather than an option so that
there is exactly one mechanism for it.

See [SaferFetch.saferFetchBytes](saferFetchBytes.md) for what this primitive does **not** protect against,
and for the warning about echoing failure detail to untrusted callers.

## Call Signature

> **saferFetchJson**\<`T`\>(`url`, `options`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`T`\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

Fetches a URL, parses the response body as JSON, and runs it through the supplied converter
or validator so the caller reaches a validated `T` in one step.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `url` | `string` \| `URL` | The URL to fetch. |
| `options` | [`ISaferFetchJsonOptions`](../interfaces/ISaferFetchJsonOptions.md)\<`T`\> | Call options plus the required `converter`. `addressGuard` is required. `maxResponseBytes` defaults to 5 MiB and is meant to be tuned per call. |

### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaferFetchResponse`](../interfaces/ISaferFetchResponse.md)\<`T`\>, [`FetchFailureReason`](../type-aliases/FetchFailureReason.md)\>\>

### Remarks

`T` is inferred from `converter` and is never caller-asserted, so the returned type is
evidenced at runtime rather than claimed.

See [SaferFetch.saferFetchBytes](saferFetchBytes.md) for what this primitive does **not** protect against,
and for the warning about echoing failure detail to untrusted callers.
