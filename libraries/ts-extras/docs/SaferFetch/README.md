[Home](../README.md) > SaferFetch

# Namespace: SaferFetch

A safer `fetch` primitive with an explicit threat model.

This is deliberately **not** a thin, unopinionated boundary over an upstream library. There
is no upstream to wrap — `fetch` is a platform global — and the opinion *is* the product:
the deadlines, the scheme refusal, the streaming size cap, the redirect posture, and the
required address guard are the deliverable. A caller who strips the opinion out has `fetch`,
which is where they started.

The guiding constraint: *a primitive that advertises a guarantee it does not have is worse
than five lines at a call site, because it transfers responsibility without transferring
protection.* Every entry point's documentation names what it does **not** protect against
next to what it does.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[GuardedFetchError](./classes/GuardedFetchError.md)

</td><td>

The error a SaferFetch.GuardedFetch rejects with, for every failure: a guard refusal, a
rejected redirect, a headers timeout, a caller's abort, a network failure, an unsupported
request, or a declared body over `maxResponseBytes`.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IRetryPolicy](./interfaces/IRetryPolicy.md)

</td><td>

Opt-in retry policy.

</td></tr>
<tr><td>

[IAddressGuard](./interfaces/IAddressGuard.md)

</td><td>

Decides whether a connection may be made.

</td></tr>
<tr><td>

[IFetchTransport](./interfaces/IFetchTransport.md)

</td><td>

Performs the actual request.

</td></tr>
<tr><td>

[IFetchTransportHints](./interfaces/IFetchTransportHints.md)

</td><td>

Out-of-band information a transport may need that `RequestInit` cannot express.

</td></tr>
<tr><td>

[IGuardedFetchOptions](./interfaces/IGuardedFetchOptions.md)

</td><td>

Options for SaferFetch.createGuardedFetch.

</td></tr>
<tr><td>

[IGuardVerdict](./interfaces/IGuardVerdict.md)

</td><td>

An address guard's decision about a hop.

</td></tr>
<tr><td>

[IRequestGuard](./interfaces/IRequestGuard.md)

</td><td>

Policy guard over the outbound request.

</td></tr>
<tr><td>

[IRequestHop](./interfaces/IRequestHop.md)

</td><td>

One hop in a redirect chain.

</td></tr>
<tr><td>

[IResolvedGuards](./interfaces/IResolvedGuards.md)

</td><td>

The guards a call will actually use.

</td></tr>
<tr><td>

[IResponseBodyGuard](./interfaces/IResponseBodyGuard.md)

</td><td>

Policy guard over the buffered response body.

</td></tr>
<tr><td>

[IResponseHeadersGuard](./interfaces/IResponseHeadersGuard.md)

</td><td>

Policy guard over the response head.

</td></tr>
<tr><td>

[ISaferFetchOptions](./interfaces/ISaferFetchOptions.md)

</td><td>

Options common to every safer-fetch entry point.

</td></tr>
<tr><td>

[ISaferFetchRequest](./interfaces/ISaferFetchRequest.md)

</td><td>

The request a safer-fetch call is about to issue.

</td></tr>
<tr><td>

[ISaferFetchResponse](./interfaces/ISaferFetchResponse.md)

</td><td>

A successful safer-fetch response.

</td></tr>
<tr><td>

[ISaferFetchResponseHead](./interfaces/ISaferFetchResponseHead.md)

</td><td>

Response status and headers, available before any body bytes are read.

</td></tr>
<tr><td>

[ISaferFetchJsonOptions](./interfaces/ISaferFetchJsonOptions.md)

</td><td>

Options for the validating form of SaferFetch.saferFetchJson.

</td></tr>
<tr><td>

[IAddressCheckVerdict](./interfaces/IAddressCheckVerdict.md)

</td><td>

The evidence behind an allowed address-policy decision.

</td></tr>
<tr><td>

[IAddressPolicy](./interfaces/IAddressPolicy.md)

</td><td>

A pure, synchronous decision over a set of IP addresses.

</td></tr>
<tr><td>

[IBlockPrivateNetworksOptions](./interfaces/IBlockPrivateNetworksOptions.md)

</td><td>

Options shared by blockPrivateNetworksPolicy and the address guard built over it.

</td></tr>
<tr><td>

[IBlockPrivateNetworksGuardOptions](./interfaces/IBlockPrivateNetworksGuardOptions.md)

</td><td>

Options for SaferFetch.blockPrivateNetworks.

</td></tr>
<tr><td>

[IClassifiedAddress](./interfaces/IClassifiedAddress.md)

</td><td>

The result of classifying a single IP address literal.

</td></tr>
<tr><td>

[IEmbeddedIpv4](./interfaces/IEmbeddedIpv4.md)

</td><td>

The IPv4 address an IPv6 address embedded, and the way it embedded it.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[FetchFailureKind](./type-aliases/FetchFailureKind.md)

</td><td>

The `kind` discriminant of a `FetchFailureReason`.

</td></tr>
<tr><td>

[FetchFailureReason](./type-aliases/FetchFailureReason.md)

</td><td>

Machine-readable reason a safer-fetch call failed, carried as the detail of the

</td></tr>
<tr><td>

[FetchTimeoutPhase](./type-aliases/FetchTimeoutPhase.md)

</td><td>

Which deadline a SaferFetch.FetchFailureReason | timeout failure belongs to.

</td></tr>
<tr><td>

[GuardedFetch](./type-aliases/GuardedFetch.md)

</td><td>

A `fetch`-shaped function whose every request goes through the safer-fetch hop walk, and whose
response body is returned **unread**.

</td></tr>
<tr><td>

[SaferFetchMethod](./type-aliases/SaferFetchMethod.md)

</td><td>

HTTP methods a safer-fetch call may use.

</td></tr>
<tr><td>

[SaferFetchRedirectPolicy](./type-aliases/SaferFetchRedirectPolicy.md)

</td><td>

How redirects are handled.

</td></tr>
<tr><td>

[HostResolver](./type-aliases/HostResolver.md)

</td><td>

Resolves a hostname to every address it names.

</td></tr>
<tr><td>

[AddressClassification](./type-aliases/AddressClassification.md)

</td><td>

The security-relevant classification of an IP address.

</td></tr>
<tr><td>

[AddressFamily](./type-aliases/AddressFamily.md)

</td><td>

The address family of a parsed IP address literal.

</td></tr>
<tr><td>

[Ipv4EmbeddingKind](./type-aliases/Ipv4EmbeddingKind.md)

</td><td>

The way an IPv6 address carried the IPv4 address whose classification was used.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[allowAnyAddress](./functions/allowAnyAddress.md)

</td><td>

An address guard that permits every address.

</td></tr>
<tr><td>

[allowContentTypes](./functions/allowContentTypes.md)

</td><td>

A response-headers guard that accepts only the listed media types.

</td></tr>
<tr><td>

[createGuardedFetch](./functions/createGuardedFetch.md)

</td><td>

Creates a `fetch`-shaped function that sends every request through the safer-fetch hop walk and

</td></tr>
<tr><td>

[saferFetchBytes](./functions/saferFetchBytes.md)

</td><td>

Fetches a URL and returns the raw response bytes, subject to the scheme check, the address

</td></tr>
<tr><td>

[saferFetchJson](./functions/saferFetchJson.md)

</td><td>

Fetches a URL and parses the response body as JSON, yielding the raw `JsonValue` for the

</td></tr>
<tr><td>

[saferFetchText](./functions/saferFetchText.md)

</td><td>

Fetches a URL and decodes the response body as text.

</td></tr>
<tr><td>

[allowAnyAddressPolicy](./functions/allowAnyAddressPolicy.md)

</td><td>

Creates a policy that permits every address, including loopback, link-local
and private ones.

</td></tr>
<tr><td>

[blockPrivateNetworksPolicy](./functions/blockPrivateNetworksPolicy.md)

</td><td>

Creates the recommended address policy: every address must be a globally
routable public unicast address.

</td></tr>
<tr><td>

[blockPrivateNetworks](./functions/blockPrivateNetworks.md)

</td><td>

Creates the recommended address guard: resolves each hop's host and requires every resolved

</td></tr>
<tr><td>

[classifyAddress](./functions/classifyAddress.md)

</td><td>

Classifies a single IP address literal.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ALWAYS_STRIPPED_HEADERS](./variables/ALWAYS_STRIPPED_HEADERS.md)

</td><td>

Header names dropped on every cross-origin redirect hop, whatever the caller configured.

</td></tr>
<tr><td>

[DEFAULT_HEADERS_TIMEOUT_MS](./variables/DEFAULT_HEADERS_TIMEOUT_MS.md)

</td><td>

Default deadline to first response headers, in milliseconds.

</td></tr>
<tr><td>

[DEFAULT_MAX_REDIRECTS](./variables/DEFAULT_MAX_REDIRECTS.md)

</td><td>

Default cap on redirect hops followed under `'validate-each-hop'`.

</td></tr>
<tr><td>

[DEFAULT_MAX_RESPONSE_BYTES](./variables/DEFAULT_MAX_RESPONSE_BYTES.md)

</td><td>

Default cap on decoded response bytes (5 MiB) — roughly an order of magnitude above a

</td></tr>
<tr><td>

[DEFAULT_RETRY_BASE_DELAY_MS](./variables/DEFAULT_RETRY_BASE_DELAY_MS.md)

</td><td>

Default base delay for SaferFetch.IRetryPolicy | retry backoff, in milliseconds.

</td></tr>
<tr><td>

[DEFAULT_RETRY_MAX_DELAY_MS](./variables/DEFAULT_RETRY_MAX_DELAY_MS.md)

</td><td>

Default ceiling on a single SaferFetch.IRetryPolicy | retry delay, in milliseconds.

</td></tr>
<tr><td>

[DEFAULT_TIMEOUT_MS](./variables/DEFAULT_TIMEOUT_MS.md)

</td><td>

Default overall deadline, in milliseconds — comfortably above a slow-but-real API and far
below "a hung request pins a socket for minutes".

</td></tr>
<tr><td>

[IDEMPOTENT_METHODS](./variables/IDEMPOTENT_METHODS.md)

</td><td>

Methods retried without an explicit opt-in.

</td></tr>
<tr><td>

[REDIRECT_STATUSES](./variables/REDIRECT_STATUSES.md)

</td><td>

Redirect statuses this primitive recognizes as redirects.

</td></tr>
<tr><td>

[RETRY_AFTER_STATUSES](./variables/RETRY_AFTER_STATUSES.md)

</td><td>

Statuses whose `Retry-After` header is honored.

</td></tr>
<tr><td>

[RETRYABLE_HTTP_STATUSES](./variables/RETRYABLE_HTTP_STATUSES.md)

</td><td>

HTTP statuses a SaferFetch.IRetryPolicy | retry policy will retry.

</td></tr>
<tr><td>

[SUPPORTED_SCHEMES](./variables/SUPPORTED_SCHEMES.md)

</td><td>

URL schemes this primitive will ever request.

</td></tr>
<tr><td>

[SAFER_FETCH_METHODS](./variables/SAFER_FETCH_METHODS.md)

</td><td>

Every HTTP method a safer-fetch call may use, as a runtime list.

</td></tr>
<tr><td>

[platformFetchTransport](./variables/platformFetchTransport.md)

</td><td>

The SaferFetch.IFetchTransport | transport that wraps `globalThis.fetch`.

</td></tr>
<tr><td>

[nodeHostResolver](./variables/nodeHostResolver.md)

</td><td>

The default SaferFetch.HostResolver: `node:dns`'s `lookup`, returning every address.

</td></tr>
</tbody></table>
