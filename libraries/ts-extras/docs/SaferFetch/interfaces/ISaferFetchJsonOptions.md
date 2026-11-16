[Home](../../README.md) > [SaferFetch](../README.md) > ISaferFetchJsonOptions

# Interface: ISaferFetchJsonOptions

Options for the validating form of SaferFetch.saferFetchJson.

**Extends:** [`ISaferFetchOptions`](../../interfaces/ISaferFetchOptions.md)

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

[converter](./ISaferFetchJsonOptions.converter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>

Applied to the parsed JSON, taking the caller from wire to validated `T` in one step.

</td></tr>
<tr><td>

[addressGuard](./ISaferFetchOptions.addressGuard.md)

</td><td>

`readonly`

</td><td>

[IAddressGuard](../../interfaces/IAddressGuard.md)

</td><td>

**Required, with no default.** A passthrough default here would be exactly the failure
this primitive exists to avoid — advertising a guarantee it does not have.

</td></tr>
<tr><td>

[requestGuard](./ISaferFetchOptions.requestGuard.md)

</td><td>

`readonly`

</td><td>

[IRequestGuard](../../interfaces/IRequestGuard.md)

</td><td>

Policy guard over the outbound request.

</td></tr>
<tr><td>

[responseHeadersGuard](./ISaferFetchOptions.responseHeadersGuard.md)

</td><td>

`readonly`

</td><td>

[IResponseHeadersGuard](../../interfaces/IResponseHeadersGuard.md)

</td><td>

Policy guard over the response head.

</td></tr>
<tr><td>

[responseBodyGuard](./ISaferFetchOptions.responseBodyGuard.md)

</td><td>

`readonly`

</td><td>

[IResponseBodyGuard](../../interfaces/IResponseBodyGuard.md)

</td><td>

Policy guard over the buffered body.

</td></tr>
<tr><td>

[method](./ISaferFetchOptions.method.md)

</td><td>

`readonly`

</td><td>

"POST" | "GET" | "HEAD" | "PUT" | "DELETE" | "PATCH"

</td><td>

Defaults to `'GET'`.

</td></tr>
<tr><td>

[headers](./ISaferFetchOptions.headers.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Request headers.

</td></tr>
<tr><td>

[body](./ISaferFetchOptions.body.md)

</td><td>

`readonly`

</td><td>

string | Uint8Array&lt;ArrayBufferLike&gt;

</td><td>

Request body.

</td></tr>
<tr><td>

[timeoutMs](./ISaferFetchOptions.timeoutMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Overall deadline in milliseconds, covering the connect, the response headers, and the
body read.

</td></tr>
<tr><td>

[headersTimeoutMs](./ISaferFetchOptions.headersTimeoutMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Deadline to first response headers, in milliseconds.

</td></tr>
<tr><td>

[maxResponseBytes](./ISaferFetchOptions.maxResponseBytes.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on decoded response bytes.

</td></tr>
<tr><td>

[redirectPolicy](./ISaferFetchOptions.redirectPolicy.md)

</td><td>

`readonly`

</td><td>

[SaferFetchRedirectPolicy](../../type-aliases/SaferFetchRedirectPolicy.md)

</td><td>

How redirects are handled.

</td></tr>
<tr><td>

[maxRedirects](./ISaferFetchOptions.maxRedirects.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on redirect hops followed under `'validate-each-hop'`.

</td></tr>
<tr><td>

[sensitiveHeaders](./ISaferFetchOptions.sensitiveHeaders.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional header names to drop on a cross-origin redirect hop, on top of the always-dropped

</td></tr>
<tr><td>

[retry](./ISaferFetchOptions.retry.md)

</td><td>

`readonly`

</td><td>

[IRetryPolicy](../../interfaces/IRetryPolicy.md)

</td><td>

Opt-in retry.

</td></tr>
<tr><td>

[transport](./ISaferFetchOptions.transport.md)

</td><td>

`readonly`

</td><td>

[IFetchTransport](../../interfaces/IFetchTransport.md)

</td><td>

Defaults to SaferFetch.platformFetchTransport.

</td></tr>
<tr><td>

[signal](./ISaferFetchOptions.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Caller's cancellation signal.

</td></tr>
<tr><td>

[logger](./ISaferFetchOptions.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Diagnostics sink.

</td></tr>
</tbody></table>
