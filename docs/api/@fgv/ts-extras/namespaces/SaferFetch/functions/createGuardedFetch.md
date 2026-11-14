[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / createGuardedFetch

# Function: createGuardedFetch()

> **createGuardedFetch**(`options`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`GuardedFetch`](../type-aliases/GuardedFetch.md)\>

Creates a `fetch`-shaped function that sends every request through the safer-fetch hop walk and
returns the response **without reading its body** — for streaming responses (Server-Sent Events,
MCP Streamable HTTP) and for libraries that take a `fetch`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`IGuardedFetchOptions`](../interfaces/IGuardedFetchOptions.md) | The guards and redirect settings, validated once, here. `addressGuard` is required: use `blockPrivateNetworks()` on Node. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`GuardedFetch`](../type-aliases/GuardedFetch.md)\>

`Success` with the function, or `Failure` if an option is invalid or refused.

## Remarks

**What it does.** Every call runs the same walk as the buffered entry points: the scheme check,
the request guard, the address guard on **every** hop before any connection, the redirect policy
(`'reject'` by default), loop detection, monotonic credential stripping on a cross-origin hop,
and a headers deadline per hop. The response-headers guard runs on the final response's head.
The final hop's platform `Response` is then returned with its body stream intact: nothing is
buffered, so the first event of a stream reaches the caller as soon as the server sends it.

**Cancellation.** The call's `init.signal` stops guard evaluation, the connect and a redirect
walk in progress, and — once the response has been returned — the body stream. A signal that is
already aborted fails the call before any guard runs. Cancelling the body after return relies on
the transport honoring `RequestInit.signal` for the body, as [SaferFetch.platformFetchTransport](../variables/platformFetchTransport.md)
does; it needs `AbortSignal.any` (Node 20.3 or later; current browsers).

**Size cap — opt-in.** With [SaferFetch.IGuardedFetchOptions.maxResponseBytes](../interfaces/IGuardedFetchOptions.md#property-maxresponsebytes) set, a
response that declares a larger `Content-Length` is refused (`'too-large'`), and any other body
is returned wrapped in a stream that counts decoded bytes as the caller reads them and errors
with a `'too-large'` [SaferFetch.GuardedFetchError](../classes/GuardedFetchError.md) — after cancelling the upstream body —
the moment the count passes the cap. The body is still never read here. There is no default cap.

**What it does not protect against** — on top of everything [SaferFetch.saferFetchBytes](saferFetchBytes.md)
lists, DNS rebinding included: there is **no deadline over the body**, **no body guard** and
**no retry**, and **no size cap unless `maxResponseBytes` is set**. A server can hold a returned
stream open for as long as the caller keeps reading, and without a cap send it without end;
bounding time is the caller's job, typically with `init.signal`. `timeoutMs`,
`responseBodyGuard` and `retry` are refused at creation rather than ignored.

**Custom credential headers.** `fetch` strips only `authorization` on a cross-origin redirect.
Redirects are rejected by default; a caller who allows them must list every custom credential
header (`x-api-key`, a session token) in `sensitiveHeaders`, or it is carried to the next origin.

**Request inputs.** The first argument is a string or `URL` (a `Request` object is refused). The
method is one of [SaferFetch.SaferFetchMethod](../type-aliases/SaferFetchMethod.md). Headers may be a `Headers`, an array of
pairs or a record. The body may be a string, `Uint8Array`, `ArrayBuffer` or `URLSearchParams`; a
stream or `FormData` is refused. Other `RequestInit` members (`redirect`, `credentials`, `mode`,
`cache`, …) are ignored.

**Failures.** The function rejects with a [SaferFetch.GuardedFetchError](../classes/GuardedFetchError.md), whose message is
fixed text and whose `reason` is the `FetchFailureReason` — which holds URLs. A non-2xx response
is returned, not rejected.
