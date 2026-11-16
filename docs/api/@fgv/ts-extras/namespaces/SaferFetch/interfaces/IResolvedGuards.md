[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IResolvedGuards

# Interface: IResolvedGuards

The guards a call will actually use. Every field is concrete: defaults are applied once, at
the boundary, and nothing downstream branches on a guard's absence.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-address"></a> `address` | `readonly` | [`IAddressGuard`](IAddressGuard.md) | Caller-supplied; there is no default. |
| <a id="property-request"></a> `request` | `readonly` | [`IRequestGuard`](IRequestGuard.md) | - |
| <a id="property-responsebody"></a> `responseBody` | `readonly` | [`IResponseBodyGuard`](IResponseBodyGuard.md) | - |
| <a id="property-responseheaders"></a> `responseHeaders` | `readonly` | [`IResponseHeadersGuard`](IResponseHeadersGuard.md) | - |
