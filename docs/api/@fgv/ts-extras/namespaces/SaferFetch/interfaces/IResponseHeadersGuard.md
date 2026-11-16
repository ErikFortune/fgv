[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IResponseHeadersGuard

# Interface: IResponseHeadersGuard

Policy guard over the response head.

## Remarks

Runs before any body bytes are read, so a rejection costs a header comparison instead of a
partial body transfer. This is the right layer for content-type gating — see
[SaferFetch.allowContentTypes](../functions/allowContentTypes.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-acceptedcontenttypes"></a> `acceptedContentTypes?` | `readonly` | readonly `string`[] | The media types this guard accepts, when it is a content-type allowlist. **Remarks** Present so that a rejection can be reported as `'unsupported-content-type'` carrying the accepted list, rather than as an opaque policy rejection the caller has to parse a message to understand. A guard that is not a content-type allowlist omits it and its rejections are reported as `'blocked-by-guard'`. |
| <a id="property-name"></a> `name` | `readonly` | `string` | - |

## Methods

### check()

> **check**(`head`, `chain`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `head` | [`ISaferFetchResponseHead`](ISaferFetchResponseHead.md) |
| `chain` | readonly [`IRequestHop`](IRequestHop.md)[] |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>
