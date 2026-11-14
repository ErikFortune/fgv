[Home](../README.md) > IGuardedFetchOptions

# Interface: IGuardedFetchOptions

Options for SaferFetch.createGuardedFetch. A subset of SaferFetch.ISaferFetchOptions:
the per-request inputs (method, headers, body, signal) arrive on each call's `RequestInit`
instead, and every option that needs the body buffered is absent.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[addressGuard](./IGuardedFetchOptions.addressGuard.md)

</td><td>

`readonly`

</td><td>

[IAddressGuard](IAddressGuard.md)

</td><td>

**Required, with no default** — for the same reason as SaferFetch.ISaferFetchOptions.addressGuard.

</td></tr>
<tr><td>

[requestGuard](./IGuardedFetchOptions.requestGuard.md)

</td><td>

`readonly`

</td><td>

[IRequestGuard](IRequestGuard.md)

</td><td>

Policy guard over each outbound request.

</td></tr>
<tr><td>

[responseHeadersGuard](./IGuardedFetchOptions.responseHeadersGuard.md)

</td><td>

`readonly`

</td><td>

[IResponseHeadersGuard](IResponseHeadersGuard.md)

</td><td>

Policy guard over the head of every response the function returns, whatever its status.

</td></tr>
<tr><td>

[redirectPolicy](./IGuardedFetchOptions.redirectPolicy.md)

</td><td>

`readonly`

</td><td>

[SaferFetchRedirectPolicy](../type-aliases/SaferFetchRedirectPolicy.md)

</td><td>

How redirects are handled.

</td></tr>
<tr><td>

[maxRedirects](./IGuardedFetchOptions.maxRedirects.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on redirect hops followed under `'validate-each-hop'`.

</td></tr>
<tr><td>

[sensitiveHeaders](./IGuardedFetchOptions.sensitiveHeaders.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional header names to drop on a cross-origin redirect hop, on top of

</td></tr>
<tr><td>

[headersTimeoutMs](./IGuardedFetchOptions.headersTimeoutMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Deadline from the start of each hop to its response headers, in milliseconds.

</td></tr>
<tr><td>

[maxResponseBytes](./IGuardedFetchOptions.maxResponseBytes.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on the response body, in bytes, counted as the caller reads it.

</td></tr>
<tr><td>

[transport](./IGuardedFetchOptions.transport.md)

</td><td>

`readonly`

</td><td>

[IFetchTransport](IFetchTransport.md)

</td><td>

Defaults to SaferFetch.platformFetchTransport.

</td></tr>
<tr><td>

[logger](./IGuardedFetchOptions.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Diagnostics sink.

</td></tr>
</tbody></table>
