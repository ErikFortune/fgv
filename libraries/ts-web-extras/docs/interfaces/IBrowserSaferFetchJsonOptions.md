[Home](../README.md) > IBrowserSaferFetchJsonOptions

# Interface: IBrowserSaferFetchJsonOptions

Options for the validating form of `browserSaferFetchJson`.

**Extends:** [`IBrowserSaferFetchOptions`](../type-aliases/IBrowserSaferFetchOptions.md)

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

[converter](./IBrowserSaferFetchJsonOptions.converter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>

Applied to the parsed JSON, taking the caller from wire to validated `T` in one step.

</td></tr>
<tr><td>

[addressGuard](./IBrowserSaferFetchJsonOptions.addressGuard.md)

</td><td>

`readonly`

</td><td>

IAddressGuard

</td><td>

**Required, with no default.** A passthrough default here would be exactly the failure
this primitive exists to avoid — advertising a guarantee it does not have.

</td></tr>
<tr><td>

[requestGuard](./IBrowserSaferFetchJsonOptions.requestGuard.md)

</td><td>

`readonly`

</td><td>

IRequestGuard

</td><td>

Policy guard over the outbound request.

</td></tr>
<tr><td>

[responseHeadersGuard](./IBrowserSaferFetchJsonOptions.responseHeadersGuard.md)

</td><td>

`readonly`

</td><td>

IResponseHeadersGuard

</td><td>

Policy guard over the response head.

</td></tr>
<tr><td>

[responseBodyGuard](./IBrowserSaferFetchJsonOptions.responseBodyGuard.md)

</td><td>

`readonly`

</td><td>

IResponseBodyGuard

</td><td>

Policy guard over the buffered body.

</td></tr>
<tr><td>

[method](./IBrowserSaferFetchJsonOptions.method.md)

</td><td>

`readonly`

</td><td>

"GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE"

</td><td>

Defaults to `'GET'`.

</td></tr>
<tr><td>

[headers](./IBrowserSaferFetchJsonOptions.headers.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

Request headers.

</td></tr>
<tr><td>

[body](./IBrowserSaferFetchJsonOptions.body.md)

</td><td>

`readonly`

</td><td>

string | Uint8Array&lt;ArrayBufferLike&gt;

</td><td>

Request body.

</td></tr>
<tr><td>

[timeoutMs](./IBrowserSaferFetchJsonOptions.timeoutMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Overall deadline in milliseconds, covering the connect, the response headers, and the
body read.

</td></tr>
<tr><td>

[headersTimeoutMs](./IBrowserSaferFetchJsonOptions.headersTimeoutMs.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Deadline to first response headers, in milliseconds.

</td></tr>
<tr><td>

[maxResponseBytes](./IBrowserSaferFetchJsonOptions.maxResponseBytes.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on decoded response bytes.

</td></tr>
<tr><td>

[redirectPolicy](./IBrowserSaferFetchJsonOptions.redirectPolicy.md)

</td><td>

`readonly`

</td><td>

SaferFetchRedirectPolicy

</td><td>

How redirects are handled.

</td></tr>
<tr><td>

[maxRedirects](./IBrowserSaferFetchJsonOptions.maxRedirects.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Cap on redirect hops followed under `'validate-each-hop'`.

</td></tr>
<tr><td>

[sensitiveHeaders](./IBrowserSaferFetchJsonOptions.sensitiveHeaders.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional header names to drop on a cross-origin redirect hop, on top of the always-dropped

</td></tr>
<tr><td>

[retry](./IBrowserSaferFetchJsonOptions.retry.md)

</td><td>

`readonly`

</td><td>

IRetryPolicy

</td><td>

Opt-in retry.

</td></tr>
<tr><td>

[transport](./IBrowserSaferFetchJsonOptions.transport.md)

</td><td>

`readonly`

</td><td>

IFetchTransport

</td><td>

Defaults to SaferFetch.platformFetchTransport.

</td></tr>
<tr><td>

[signal](./IBrowserSaferFetchJsonOptions.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Caller's cancellation signal.

</td></tr>
<tr><td>

[logger](./IBrowserSaferFetchJsonOptions.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Diagnostics sink.

</td></tr>
</tbody></table>
