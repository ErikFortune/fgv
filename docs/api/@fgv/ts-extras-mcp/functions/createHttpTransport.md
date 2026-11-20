[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / createHttpTransport

# Function: createHttpTransport()

> **createHttpTransport**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

Creates a Streamable-HTTP MCP transport for the given endpoint URL.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IMcpHttpTransportParams`](../interfaces/IMcpHttpTransportParams.md) | The endpoint URL, optional static headers, and the optional `fetch`. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMcpTransport`](../interfaces/IMcpTransport.md)\>

`Success` with an opaque transport handle, or `Failure` if the URL is invalid, `fetch`
is not a function, `headers` names one header more than once in different letter cases, a header
is not a valid HTTP header, or reading the `authProvider` throws (with fixed text: what threw is
the consumer's).

## Remarks

**Egress.** Pass a `fetch` from `SaferFetch.createGuardedFetch` with
`SaferFetch.blockPrivateNetworks()` as its address guard (both from `@fgv/ts-extras`) to give
every request the session makes — the `POST`s, the standalone `GET` event stream and the
termination `DELETE` — the same SSRF protection as the rest of your egress:

```ts
const fetch = SaferFetch.createGuardedFetch({ addressGuard: SaferFetch.blockPrivateNetworks() }).orThrow();
const transport = createHttpTransport({ url, fetch }).orThrow();
```
Without it, requests go out through
`globalThis.fetch` with no address guard, and redirects follow the SDK's same-origin default. See
[IMcpHttpTransportParams.fetch](../interfaces/IMcpHttpTransportParams.md#property-fetch).
