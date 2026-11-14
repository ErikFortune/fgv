[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IAddressGuard

# Interface: IAddressGuard

Decides whether a connection may be made. Invoked once per redirect hop, never only on
the initial URL.

## Remarks

This is the SSRF boundary and the one guard whose failure is catastrophic, which is why
it is a separate seam from the request and response policy guards: "did the address check
run, and run correctly?" should be answerable by reading one small implementation.

The seam is **asynchronous and hop-chain-aware so that it can wrap a pure classifier**: a
real guard resolves `url.hostname` to an address list and then delegates the judgement to a
synchronous, address-list-in policy. That split keeps the part with the adversarial test
matrix — the address classification itself — free of transports, DNS, and hop bookkeeping,
and keeps exactly one implementation of it. A guard is the resolving, chain-aware half; it
should not re-derive what the classifier already decides.

Classify `url.hostname`, never raw URL text: the WHATWG parser has already normalized
`127.0x.1` to `127.0.0.1` and `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe`, and text
matching misses both.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | Stable identifier, surfaced in `'blocked-by-guard'` failures. |

## Methods

### check()

> **check**(`chain`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IGuardVerdict`](IGuardVerdict.md)\>\>

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chain` | readonly [`IRequestHop`](IRequestHop.md)[] | Every hop so far, oldest first. The URL under consideration is the last entry; `chain.length === 1` is the initial request. There is deliberately no separate "is this a redirect" flag — hop 0 is not a special case, and a guard that compares only against the immediately previous hop cannot see an `A → B → A` laundering hop. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IGuardVerdict`](IGuardVerdict.md)\>\>
