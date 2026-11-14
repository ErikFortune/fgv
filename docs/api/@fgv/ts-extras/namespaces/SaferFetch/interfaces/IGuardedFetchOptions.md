[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IGuardedFetchOptions

# Interface: IGuardedFetchOptions

Options for [SaferFetch.createGuardedFetch](../functions/createGuardedFetch.md). A subset of [SaferFetch.ISaferFetchOptions](ISaferFetchOptions.md):
the per-request inputs (method, headers, body, signal) arrive on each call's `RequestInit`
instead, and every option that needs the body buffered is absent.

## Remarks

**Absent on purpose, and refused if supplied:** `timeoutMs` (a deadline over the body would cut
off a stream that is meant to live for an hour), `responseBodyGuard` (it needs the whole body,
which this entry point never buffers), and `retry` (it would replay a non-idempotent `POST`, and a
streaming caller has usually consumed part of the response before it could know to retry). A
caller who needs those wants a buffered entry point. `maxResponseBytes` is accepted: it is
enforced by counting the body as the caller reads it, never by reading it here.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-addressguard"></a> `addressGuard` | `readonly` | [`IAddressGuard`](IAddressGuard.md) | **Required, with no default** — for the same reason as [SaferFetch.ISaferFetchOptions.addressGuard](ISaferFetchOptions.md#property-addressguard). Runs on every hop, before any connection. |
| <a id="property-headerstimeoutms"></a> `headersTimeoutMs?` | `readonly` | `number` | Deadline from the start of each hop to its response headers, in milliseconds. Default [SaferFetch.DEFAULT\_HEADERS\_TIMEOUT\_MS](../variables/DEFAULT_HEADERS_TIMEOUT_MS.md). It covers the request and address guards, the connect, the wait for headers and the response-headers guard, and is cleared once that guard accepts: a stream that then lives for an hour is not cut off. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Diagnostics sink. Defaults to a no-op logger. Hop failures are logged at `detail`, with URLs. |
| <a id="property-maxredirects"></a> `maxRedirects?` | `readonly` | `number` | Cap on redirect hops followed under `'validate-each-hop'`. Default [SaferFetch.DEFAULT\_MAX\_REDIRECTS](../variables/DEFAULT_MAX_REDIRECTS.md). |
| <a id="property-maxresponsebytes"></a> `maxResponseBytes?` | `readonly` | `number` | Cap on the response body, in bytes, counted as the caller reads it. Opt-in: with no value the body is unbounded and the platform's own `Response` is returned untouched. **Remarks** When set, the function still never reads the body itself. A response whose `Content-Length` already declares more than the cap is refused before it is returned: the call rejects with a [SaferFetch.GuardedFetchError](../classes/GuardedFetchError.md) whose reason is `'too-large'` (`bytesRead: 0`), and the body is released. Any other response with a body is returned with that body wrapped in a counting stream, carrying the original status, status text, headers, `url` and `redirected`. The count is of **decoded** bytes, as with the buffered entry points, so a lying `Content-Length` and a gzip bomb both trip it. The chunk that takes the count past the cap is never delivered: the upstream body is cancelled, which releases the connection, and the stream errors with a `GuardedFetchError` whose reason is `'too-large'` (`bytesRead` is the count including that chunk) and whose message names `maxResponseBytes` and the limit. A body of exactly the cap is delivered whole. It bounds size, not time: a server that trickles bytes slowly, or holds the stream open, is still bounded only by the call's `init.signal`. Must be a positive finite number. |
| <a id="property-redirectpolicy"></a> `redirectPolicy?` | `readonly` | [`SaferFetchRedirectPolicy`](../type-aliases/SaferFetchRedirectPolicy.md) | How redirects are handled. Defaults to `'reject'`, as everywhere in safer-fetch. The caller's `RequestInit.redirect` is ignored: the platform is never allowed to follow a hop the guard did not see. |
| <a id="property-requestguard"></a> `requestGuard?` | `readonly` | [`IRequestGuard`](IRequestGuard.md) | Policy guard over each outbound request. Defaults to silent passthrough. |
| <a id="property-responseheadersguard"></a> `responseHeadersGuard?` | `readonly` | [`IResponseHeadersGuard`](IResponseHeadersGuard.md) | Policy guard over the head of every response the function returns, whatever its status. It runs before the response is handed back, so a refusal costs no body bytes. Defaults to silent passthrough. |
| <a id="property-sensitiveheaders"></a> `sensitiveHeaders?` | `readonly` | readonly `string`[] | Additional header names to drop on a cross-origin redirect hop, on top of [SaferFetch.ALWAYS\_STRIPPED\_HEADERS](../variables/ALWAYS_STRIPPED_HEADERS.md). **Remarks** **A caller that allows redirects must list its custom credential headers here** — `x-api-key`, `x-auth-token`, a session or routing token such as MCP's `mcp-session-id`. `fetch` itself strips only `authorization` on a cross-origin redirect, and this primitive strips only the three it always strips: a header it was not told about is carried to the next origin. |
| <a id="property-transport"></a> `transport?` | `readonly` | [`IFetchTransport`](IFetchTransport.md) | Defaults to [SaferFetch.platformFetchTransport](../variables/platformFetchTransport.md). |
