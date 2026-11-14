[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IFetchTransport

# Interface: IFetchTransport

Performs the actual request.

## Remarks

Injectable for two reasons. It is the seam through which a pinned-connect implementation
drops in without any caller-visible signature change — which is what keeps closing the
DNS-rebinding hole additive rather than breaking. And it is the test seam: redirect chains,
lying `Content-Length` headers, compression-bomb shapes, and trickling bodies are all
unit-testable through a scripted transport, with no live server anywhere in the suite.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` |

## Methods

### fetch()

> **fetch**(`url`, `init`, `hints`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Response`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `URL` |
| `init` | `RequestInit` |
| `hints` | [`IFetchTransportHints`](IFetchTransportHints.md) |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Response`\>\>
