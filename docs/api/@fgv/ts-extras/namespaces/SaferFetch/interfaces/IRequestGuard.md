[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IRequestGuard

# Interface: IRequestGuard

Policy guard over the outbound request.

## Remarks

**Reject-only.** Silently rewriting a caller's headers or body inside a fetch primitive
means the caller no longer knows what was sent. To alter the request, return an explicit
replacement the caller could have observed.

Runs **before** the address guard, so an address guard is always the last word before the
connect: a replacement request that changed the URL is still address-checked.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` |

## Methods

### check()

> **check**(`request`, `chain`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISaferFetchRequest`](ISaferFetchRequest.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ISaferFetchRequest`](ISaferFetchRequest.md) |
| `chain` | readonly [`IRequestHop`](IRequestHop.md)[] |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISaferFetchRequest`](ISaferFetchRequest.md)\>\>
