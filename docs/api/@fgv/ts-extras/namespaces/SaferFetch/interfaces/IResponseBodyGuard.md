[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IResponseBodyGuard

# Interface: IResponseBodyGuard

Policy guard over the buffered response body.

## Remarks

Runs on the buffered body, after the size cap has been enforced — so it can never be handed
an unbounded stream.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` |

## Methods

### check()

> **check**(`body`, `head`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `Uint8Array` |
| `head` | [`ISaferFetchResponseHead`](ISaferFetchResponseHead.md) |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>\>
